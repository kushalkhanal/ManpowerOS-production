import Passport from "../models/Passport.js";
import PassportLog from "../models/PassportLog.js";
import Candidate from "../models/Candidate.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { extractPassportData } from "../services/passportOcrService.js";
import { adToBS } from "../utils/bsDate.js";
import path from "path";
import fs from "fs";
import { scopeFilter, scopeData } from "../utils/tenantHelper.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import { buildCursorFilter, buildCursorPage } from "../utils/pagination.js";
import { sanitizeFilename } from "../utils/fileSystemSanitize.js";
import {
  deleteCloudinaryFile,
  getPublicIdFromUrl,
} from "../middleware/upload.js";
import logger from "../config/logger.js";

const cleanupCloudinaryAssets = (urls) => {
  if (!urls || urls.length === 0) return;
  Promise.all(
    urls
      .filter(Boolean)
      .map(getPublicIdFromUrl)
      .filter(Boolean)
      .map((publicId) => deleteCloudinaryFile(publicId)),
  ).catch((err) => logger.error("Cloudinary cleanup failed", err));
};

const createPassport = asyncHandler(async (req, res) => {
  const {
    candidateId,
    passportNumber,
    guardianNumber,
    fullName,
    dateOfBirth,
    issueDate,
    expiryDate,
    issuedDistrict,
    location,
    notes,
    scannedImageUrl,
    gender,
    desiredCountry,
    contactPhone,
    contactAddress,
  } = req.body;

  const resolvedAgencyId = req.user.agencyId || req.body.agencyId;
  if (!resolvedAgencyId) {
    throw new AppError(
      "Agency context is required. Superadmin must provide agencyId to create passport.",
      400,
    );
  }

  if (!passportNumber || !fullName) {
    throw new AppError("passportNumber and fullName are required", 400);
  }

  if (candidateId) {
    const candidate = await Candidate.findOne(
      scopeFilter(req, { _id: candidateId }),
    );
    if (!candidate) throw new AppError("Candidate not found", 404);
  }

  const existingPassport = await Passport.findOne(
    scopeFilter(req, { passportNumber }),
  );
  if (existingPassport)
    throw new AppError(
      "Passport number already exists within this agency",
      409,
    );

  const passportData = {
    agencyId: resolvedAgencyId,
    passportNumber,
    guardianNumber: guardianNumber || undefined,
    fullName,
    dateOfBirth: dateOfBirth || undefined,
    issueDate: issueDate || undefined,
    expiryDate: expiryDate || undefined,
    issuedDistrict: issuedDistrict || undefined,
    location: location || undefined,
    notes: notes || undefined,
    scannedImageUrl: scannedImageUrl || undefined,
    gender: gender || undefined,
    desiredCountry: desiredCountry || undefined,
    contactPhone: contactPhone || undefined,
    contactAddress: contactAddress || undefined,
    collectedBy: req.user.userId,
    collectedAt: new Date(),
    custodyStatus: "with_agency",
    allocationStatus: candidateId ? "allocated" : "in_pool",
    candidateId: candidateId || undefined,
  };

  if (candidateId) {
    passportData.allocatedToDemandId = null;
    passportData.allocatedAt = new Date();
    passportData.allocatedBy = req.user.userId;
  }

  let passport;
  try {
    passport = await Passport.create(scopeData(req, passportData));
  } catch (err) {
    if (err.code === 11000)
      throw new AppError(
        "Passport number already exists within this agency",
        409,
      );
    throw err;
  }

  // Auto-create stub candidate for pool passports so the user can edit profile
  // sections (address, bank, training, etc.) and generate a CV before the
  // passport is matched to a demand. Allocation later updates this same record.
  // findOneAndUpdate+upsert is atomic — concurrent requests for the same
  // passportId will not create duplicate candidates (unique sparse index enforces this).
  if (!candidateId) {
    try {
      const setOnInsert = scopeData(req, {
        fullName: passport.fullName,
        dateOfBirth: passport.dateOfBirth,
        gender: passport.gender || "male",
        nationalIdNumber: passport.passportNumber,
        phone: passport.contactPhone || "",
        passportId: passport._id,
        passportNumber: passport.passportNumber,
        status: "registered",
        agentId: req.user.userId,
        registeredAt: new Date(),
      });
      const stubCandidate = await Candidate.findOneAndUpdate(
        scopeFilter(req, { passportId: passport._id }),
        { $setOnInsert: setOnInsert },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      await Passport.findByIdAndUpdate(passport._id, {
        $set: { candidateId: stubCandidate._id },
      });
    } catch (err) {
      logger.error("Failed to auto-create stub candidate for passport", err);
      // Don't block passport creation — allocation can still create one later.
    }
  }

  // Log creation
  await PassportLog.create({
    passportId: passport._id,
    agencyId: resolvedAgencyId,
    performedBy: req.user.userId,
    action: candidateId ? "collected_with_candidate" : "collected",
    toStatus: candidateId ? "allocated" : "with_agency",
    notes: candidateId
      ? "Passport collected and linked to existing candidate"
      : "Passport added to pool",
  });

  const populated = await Passport.findById(passport._id)
    .populate("candidateId", "fullName")
    .populate("collectedBy", "name");

  res.status(201).json(populated);
});

const PASSPORT_LIST_POPULATE = [
  {
    path: "candidateId",
    select:
      "fullName phone email status nationalIdNumber permanentDistrict permanentMunicipality desiredCountry desiredJobCategory skills",
  },
  { path: "collectedBy", select: "name" },
  {
    path: "allocatedToDemandId",
    select: "employerCompanyName employerCountry jobCategory",
  },
];

const getPassports = asyncHandler(async (req, res) => {
  const { status, search, allocationStatus } = req.query;

  const baseFilter = scopeFilter(req);
  if (status) baseFilter.custodyStatus = status;
  if (allocationStatus) baseFilter.allocationStatus = allocationStatus;
  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");
    baseFilter.$or = [
      { passportNumber: searchRegex },
      { fullName: searchRegex },
    ];
  }

  const { filter, limitNumber, hasCursor } = buildCursorFilter(
    req.query,
    baseFilter,
  );

  const fetchQuery = Passport.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limitNumber + 1)
    .populate(PASSPORT_LIST_POPULATE);

  if (hasCursor) {
    const results = await fetchQuery;
    return res.status(200).json(buildCursorPage(results, limitNumber));
  }

  const [passports, total] = await Promise.all([
    fetchQuery,
    Passport.countDocuments(baseFilter),
  ]);

  res.status(200).json(buildCursorPage(passports, limitNumber, total));
});

const getPassportById = asyncHandler(async (req, res) => {
  // Use .lean() so populate returns RAW BSON for the candidate — Mongoose
  // hydration would otherwise strip fields like `physicalAttributes` and
  // `workHistory` when the on-disk subdoc shape doesn't perfectly match the
  // schema. Lean reads bypass that entirely.
  const passport = await Passport.findOne(
    scopeFilter(req, {
      _id: req.params.id,
    }),
  )
    .populate(
      "candidateId",
      [
        "fullName",
        "phone",
        "email",
        "status",
        "nationalIdNumber",
        "gender",
        "dateOfBirth",
        "maritalStatus",
        "religion",
        "permanentProvince",
        "permanentDistrict",
        "permanentMunicipality",
        "permanentWardNo",
        "temporaryAddress",
        "temporaryMunicipality",
        "temporaryDistrict",
        "temporaryProvince",
        "bankInfo",
        "training",
        "academic",
        "nomineeInfo",
        "visaNumber",
        "visaIssuedDate",
        "visaReceivedDate",
        "visaExpiryDate",
        "kdnBpaNo",
        "branchInfo",
        "desiredCountry",
        "desiredJobCategory",
        "skills",
        "physicalAttributes",
        "workHistory",
        "workExperienceYears",
        "languagesKnown",
        "education",
      ].join(" "),
    )
    .populate("collectedBy", "name")
    .populate("returnedBy", "name")
    .populate(
      "allocatedToDemandId",
      "employerCompanyName employerCountry jobCategory",
    )
    .lean();

  if (!passport) throw new AppError("Passport not found", 404);

  const logs = await PassportLog.find({ passportId: passport._id })
    .sort({ timestamp: -1 })
    .populate("performedBy", "name")
    .lean();

  res.status(200).json({ passport, logs });
});

const updatePassportStatus = asyncHandler(async (req, res) => {
  const {
    custodyStatus,
    notes,
    location,
    sponsorName,
    sponsorNumber,
    assignedStaff,
  } = req.body;

  if (!custodyStatus) throw new AppError("custodyStatus is required", 400);

  const VALID_TRANSITIONS = {
    with_agency: ["returned_to_candidate", "submitted_embassy", "lost"],
    returned_to_candidate: ["with_agency"],
    submitted_embassy: ["with_agency", "lost"],
    lost: [],
  };

  const passport = await Passport.findOne(
    scopeFilter(req, { _id: req.params.id }),
  );
  if (!passport) throw new AppError("Passport not found", 404);

  const currentStatus = passport.custodyStatus;
  if (!VALID_TRANSITIONS[currentStatus]?.includes(custodyStatus)) {
    throw new AppError(
      `Invalid status transition from ${currentStatus} to ${custodyStatus}`,
      400,
    );
  }

  const updateData = { custodyStatus };
  if (location) updateData.location = location;
  if (notes) updateData.notes = notes;
  if (sponsorName !== undefined) updateData.sponsorName = sponsorName;
  if (sponsorNumber !== undefined) updateData.sponsorNumber = sponsorNumber;
  if (assignedStaff !== undefined) updateData.assignedStaff = assignedStaff;

  if (custodyStatus === "returned_to_candidate") {
    updateData.returnedBy = req.user.userId;
    updateData.returnedAt = new Date();
  }

  const updatedPassport = await Passport.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    { new: true, runValidators: true },
  )
    .populate("candidateId", "fullName")
    .populate("collectedBy", "name")
    .populate("returnedBy", "name");

  await PassportLog.create({
    passportId: passport._id,
    agencyId: req.user.agencyId,
    performedBy: req.user.userId,
    action: "status_changed",
    fromStatus: currentStatus,
    toStatus: custodyStatus,
    notes,
    sponsorName,
    sponsorNumber,
    assignedStaff,
  });

  res.status(200).json(updatedPassport);
});

const updatePassport = asyncHandler(async (req, res) => {
  const {
    passportNumber,
    guardianNumber,
    fullName,
    dateOfBirth,
    issueDate,
    expiryDate,
    issuedDistrict,
    location,
    notes,
    contactPhone,
    gender,
  } = req.body;

  const passport = await Passport.findOne(
    scopeFilter(req, { _id: req.params.id }),
  );
  if (!passport) throw new AppError("Passport not found", 404);

  if (passportNumber && passportNumber !== passport.passportNumber) {
    const existing = await Passport.findOne({
      agencyId: req.user.agencyId,
      passportNumber,
      _id: { $ne: passport._id },
    });
    if (existing) throw new AppError("Passport number already exists", 409);
  }

  const updates = {};
  if (passportNumber) updates.passportNumber = passportNumber;
  if (guardianNumber !== undefined) updates.guardianNumber = guardianNumber;
  if (fullName) updates.fullName = fullName;
  if (dateOfBirth) updates.dateOfBirth = dateOfBirth;
  if (issueDate) updates.issueDate = issueDate;
  if (expiryDate) updates.expiryDate = expiryDate;
  if (issuedDistrict) updates.issuedDistrict = issuedDistrict;
  if (location !== undefined) updates.location = location;
  if (notes !== undefined) updates.notes = notes;
  if (contactPhone !== undefined) updates.contactPhone = contactPhone;
  if (gender !== undefined) updates.gender = gender;

  let updatedPassport;
  try {
    updatedPassport = await Passport.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    )
      .populate("candidateId", "fullName")
      .populate("collectedBy", "name")
      .populate("returnedBy", "name");
  } catch (err) {
    if (err.code === 11000)
      throw new AppError("Passport number already exists", 409);
    throw err;
  }

  const changes = [];
  for (const key in updates) {
    if (key !== "notes" && key !== "location") {
      if (passport[key]?.toString() !== updates[key]?.toString()) {
        changes.push(`${key} modified`);
      }
    }
  }

  await PassportLog.create({
    passportId: passport._id,
    agencyId: req.user.agencyId,
    performedBy: req.user.userId,
    action: "edited",
    notes: changes.length > 0 ? changes.join(", ") : notes || "Details updated",
  });

  res.status(200).json(updatedPassport);
});

const deletePassport = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    throw new AppError("Only admin can delete passports", 403);
  }

  const passport = await Passport.findOne(
    scopeFilter(req, { _id: req.params.id }),
  );
  if (!passport) throw new AppError("Passport not found", 404);

  // Soft-delete — Cloudinary assets and logs are purged after 7-day recovery window
  // by the background cleanup job (server/src/jobs/passportCleanupJob.js).
  await Passport.findByIdAndUpdate(req.params.id, {
    $set: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user.userId,
    },
  });

  await PassportLog.create({
    passportId: passport._id,
    agencyId: req.user.agencyId || passport.agencyId,
    performedBy: req.user.userId,
    action: "deleted",
    notes: "Passport soft-deleted — recoverable within 7 days",
  });

  res
    .status(200)
    .json({ message: "Passport deleted. It can be recovered within 7 days." });
});

const restorePassport = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    throw new AppError("Only admin can restore passports", 403);
  }

  const passport = await Passport.findOne(
    scopeFilter(req, { _id: req.params.id, isDeleted: true }),
  );
  if (!passport)
    throw new AppError(
      "Deleted passport not found or recovery window has expired",
      404,
    );

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (passport.deletedAt < sevenDaysAgo) {
    throw new AppError("Recovery window has expired (7 days)", 410);
  }

  await Passport.findByIdAndUpdate(req.params.id, {
    $set: { isDeleted: false, deletedAt: null, deletedBy: null },
  });

  await PassportLog.create({
    passportId: passport._id,
    agencyId: req.user.agencyId || passport.agencyId,
    performedBy: req.user.userId,
    action: "restored",
    notes: "Passport restored from soft-delete",
  });

  res.status(200).json({ message: "Passport restored successfully" });
});

const getPassportStats = asyncHandler(async (req, res) => {
  const stats = await Passport.aggregate([
    { $match: { ...scopeFilter(req), isDeleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        inPool: {
          $sum: { $cond: [{ $eq: ["$allocationStatus", "in_pool"] }, 1, 0] },
        },
        allocated: {
          $sum: { $cond: [{ $eq: ["$allocationStatus", "allocated"] }, 1, 0] },
        },
        withAgency: {
          $sum: { $cond: [{ $eq: ["$custodyStatus", "with_agency"] }, 1, 0] },
        },
        returned: {
          $sum: {
            $cond: [{ $eq: ["$custodyStatus", "returned_to_candidate"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const result = stats[0] || {
    total: 0,
    inPool: 0,
    allocated: 0,
    withAgency: 0,
    returned: 0,
  };

  delete result._id;
  res.status(200).json(result);
});

const getExpiringPassports = asyncHandler(async (req, res) => {
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

  const passports = await Passport.find(
    scopeFilter(req, {
      expiryDate: { $lte: sixtyDaysFromNow },
      custodyStatus: "with_agency",
    }),
  )
    .sort({ expiryDate: 1 })
    .populate("candidateId", "fullName phone")
    .populate("collectedBy", "name");

  res.status(200).json(passports);
});

const scanPassport = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("No image file uploaded", 400);

  let imageBuffer;
  if (req.file.buffer) {
    imageBuffer = req.file.buffer;
  } else if (req.file.path && !req.file.path.startsWith("http")) {
    imageBuffer = fs.readFileSync(req.file.path);
  } else {
    const url = req.file.location || req.file.path;
    if (!url) throw new Error("File URL missing");
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);
  }

  const extractedData = await extractPassportData(imageBuffer);

  const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

  let scannedImageUrl = null;
  if (req.file.location) {
    scannedImageUrl = req.file.location;
  } else if (req.file.path && req.file.path.startsWith("http")) {
    scannedImageUrl = req.file.path;
  } else if (req.file.path) {
    const safeFilename = sanitizeFilename(path.basename(req.file.path));
    scannedImageUrl = `${process.env.API_BASE_URL || "http://localhost:5000"}/uploads/passports/scans/${safeFilename}`;
  }

  const formatDateDisplay = (date) => {
    if (!isValidDate(date)) return null;
    const bs = adToBS(new Date(date));
    return bs ? bs.display : null;
  };

  res.status(200).json({
    success: true,
    scannedImageUrl,
    extractedData: {
      passportNumber: extractedData.passportNumber || "",
      guardianNumber: extractedData.guardianNumber || "",
      fullName: extractedData.fullName || "",
      surname: extractedData.surname || "",
      givenNames: extractedData.givenNames || "",
      dateOfBirth: isValidDate(extractedData.dateOfBirth)
        ? extractedData.dateOfBirth.toISOString()
        : null,
      dateOfBirthBS: formatDateDisplay(extractedData.dateOfBirth),
      gender: extractedData.gender || "",
      issueDate: isValidDate(extractedData.issueDate)
        ? extractedData.issueDate.toISOString()
        : null,
      issueDateBS: formatDateDisplay(extractedData.issueDate),
      expiryDate: isValidDate(extractedData.expiryDate)
        ? extractedData.expiryDate.toISOString()
        : null,
      expiryDateBS: formatDateDisplay(extractedData.expiryDate),
      issuedDistrict: extractedData.issuedDistrict || "",
      nationality: extractedData.nationality || "NPL",
    },
    confidence: extractedData.confidence || {},
    warnings: extractedData.warnings || [],
    source: extractedData.source || "unknown",
  });
});

// Idempotent — creates a stub Candidate linked to this passport if one does not
// already exist, then returns the fully populated passport. Used by the UI to
// enable profile-section editing for pool passports before demand allocation.
const ensureCandidate = asyncHandler(async (req, res) => {
  const passport = await Passport.findOne(
    scopeFilter(req, { _id: req.params.id }),
  );
  if (!passport) throw new AppError("Passport not found", 404);

  const CANDIDATE_POPULATE_FIELDS = [
    "fullName",
    "phone",
    "email",
    "status",
    "nationalIdNumber",
    "gender",
    "dateOfBirth",
    "maritalStatus",
    "religion",
    "permanentProvince",
    "permanentDistrict",
    "permanentMunicipality",
    "permanentWardNo",
    "temporaryAddress",
    "temporaryMunicipality",
    "temporaryDistrict",
    "temporaryProvince",
    "bankInfo",
    "training",
    "academic",
    "nomineeInfo",
    "visaNumber",
    "visaIssuedDate",
    "visaReceivedDate",
    "visaExpiryDate",
    "kdnBpaNo",
    "branchInfo",
    "desiredCountry",
    "desiredJobCategory",
    "skills",
    "physicalAttributes",
    "workHistory",
  ].join(" ");

  const setOnInsert = scopeData(req, {
    fullName: passport.fullName,
    dateOfBirth: passport.dateOfBirth,
    gender: passport.gender || "male",
    nationalIdNumber: passport.passportNumber,
    phone: passport.contactPhone || "",
    passportId: passport._id,
    passportNumber: passport.passportNumber,
    status: "registered",
    agentId: req.user.userId,
    registeredAt: new Date(),
  });

  // Atomic upsert — concurrent requests for the same passportId will hit the
  // unique sparse index and return the existing candidate rather than creating a duplicate.
  const stub = await Candidate.findOneAndUpdate(
    scopeFilter(req, { passportId: passport._id }),
    { $setOnInsert: setOnInsert },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await Passport.findByIdAndUpdate(passport._id, {
    $set: { candidateId: stub._id },
  });

  const populated = await Passport.findById(passport._id)
    .populate("candidateId", CANDIDATE_POPULATE_FIELDS)
    .lean();

  res.status(201).json(populated);
});

export default {
  createPassport,
  getPassports,
  getPassportById,
  updatePassportStatus,
  updatePassport,
  deletePassport,
  restorePassport,
  getExpiringPassports,
  getPassportStats,
  scanPassport,
  ensureCandidate,
};
