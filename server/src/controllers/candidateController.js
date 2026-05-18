import Candidate from "../models/Candidate.js";
import User from "../models/User.js";
import Passport from "../models/Passport.js";
import JobDemand from "../models/JobDemand.js";
import Medical from "../models/Medical.js";
import Orientation from "../models/Orientation.js";
import InsuranceSsf from "../models/InsuranceSsf.js";
import FeeTransaction from "../models/FeeTransaction.js";
import Task from "../models/Task.js";
import CandidateActivityLog from "../models/CandidateActivityLog.js";
import asyncHandler from "../utils/asyncHandler.js";
import { computeAndSaveCandidateStatus } from "../services/candidateStatusService.js";
import { scopeFilter, scopeData } from "../utils/tenantHelper.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { logActivity } from "../utils/activityLogger.js";
import { invalidateAlertCache } from "../cache/alertCache.js";

// 10-column workflow matching Nepal DoFE 5-phase process
const DOCUMENT_CHECKLIST_KEYS = {
  passport_collection: [
    "passport_received",
    "passport_verified",
    "passport_renewed",
  ],
  medical: [
    "medical_scheduled",
    "medical_conducted",
    "result_received",
    "report_uploaded",
  ],
  insurance: [
    "insurance_paid",
    "policy_generated",
    "ssf_registered",
    "ssf_receipt",
  ],
  calling_visa: [
    "demand_letter_confirmed",
    "visa_number_obtained",
    "visa_approval_confirmed",
  ],
  visa: ["embassy_submitted", "visa_stamped", "passport_returned"],
  fee: ["fee_agreed", "partial_payment", "full_payment", "receipt_issued"],
  flight: [
    "ticket_booked",
    "ticket_confirmed",
    "airline_confirmed",
    "airport_time_set",
  ],
  dofe: [
    "orientation_certified",
    "insurance_verified",
    "medical_cert_valid",
    "ssf_confirmed",
    "shram_received",
    "e_sticker_received",
  ],
  doc_prep: [
    "all_docs_compiled",
    "ticket_ready",
    "briefing_done",
    "docs_handed",
  ],
  departure: ["airport_reported", "flight_departed", "confirmation_received"],
};

const getChecklistValue = (checklistMap, columnId, itemKey, fallbackDone) => {
  if (!checklistMap) return fallbackDone;
  const mapKey = `${columnId}__${itemKey}`;
  const mapValue = checklistMap[mapKey];
  return typeof mapValue === "boolean" ? mapValue : fallbackDone;
};

const getChecklistMeta = (checklistMap, columnId, itemKey, fallbackDone) => {
  const done = getChecklistValue(checklistMap, columnId, itemKey, fallbackDone);
  return {
    done,
    autoDone: fallbackDone,
    overridden: done !== fallbackDone,
  };
};

const enrichWithCompliance = async (candidates) => {
  if (!candidates.length) return candidates;
  const ids = candidates.map((c) => c._id);
  const [medicals, orientations, insuranceSsfs] = await Promise.all([
    Medical.find({ candidateId: { $in: ids } }, "candidateId result").lean(),
    Orientation.find(
      { candidateId: { $in: ids } },
      "candidateId completionStatus",
    ).lean(),
    InsuranceSsf.find(
      { candidateId: { $in: ids } },
      "candidateId insurancePaidDate insurancePolicyNumber ssfPaidDate ssfRegistrationNumber welfareFundPaid",
    ).lean(),
  ]);
  const medMap = {},
    oriMap = {},
    insMap = {};
  for (const m of medicals) medMap[m.candidateId.toString()] = m;
  for (const o of orientations) oriMap[o.candidateId.toString()] = o;
  for (const i of insuranceSsfs) insMap[i.candidateId.toString()] = i;
  return candidates.map((c) => {
    const cid = c._id.toString();
    const ins = insMap[cid];
    return {
      ...c,
      compliance: {
        medical: medMap[cid]?.result === "fit",
        orientation: oriMap[cid]?.completionStatus === "completed",
        insurance: !!(ins?.insurancePaidDate && ins?.insurancePolicyNumber),
        ssf: !!(ins?.ssfPaidDate && ins?.ssfRegistrationNumber),
        welfare: ins?.welfareFundPaid === true,
      },
    };
  });
};

const getCandidates = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    desiredCountry,
    agentId,
    page = 1,
    limit = 20,
    cursor,
  } = req.query;
  const pageLimit = Math.min(parseInt(limit) || 20, 100);

  const filter = scopeFilter(req);

  if (status) filter.status = status;
  if (desiredCountry) filter.desiredCountry = desiredCountry;
  if (agentId) filter.agentId = agentId;

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { fullName: searchRegex },
      { phone: searchRegex },
      { nationalIdNumber: searchRegex },
    ];
  }

  // Cursor-based pagination: client sends ?cursor=<lastRegisteredAt_iso>__<lastId>
  // Falls back to offset pagination when cursor is absent (backwards compatible).
  if (cursor) {
    const [cursorDate, cursorId] = cursor.split("__");
    // AND the cursor window into the filter so it combines correctly with search $or
    const cursorCondition = {
      $or: [
        { registeredAt: { $lt: new Date(cursorDate) } },
        { registeredAt: new Date(cursorDate), _id: { $lt: cursorId } },
      ],
    };
    filter.$and = filter.$and
      ? [...filter.$and, cursorCondition]
      : [cursorCondition];

    const candidates = await Candidate.find(filter)
      .sort({ registeredAt: -1, _id: -1 })
      .limit(pageLimit + 1) // fetch one extra to determine if there's a next page
      .populate("agentId", "name")
      .lean();

    const hasMore = candidates.length > pageLimit;
    const page = candidates.slice(0, pageLimit);
    const lastItem = page[page.length - 1];
    const nextCursor =
      hasMore && lastItem
        ? `${new Date(lastItem.registeredAt).toISOString()}__${lastItem._id}`
        : null;

    const enriched = await enrichWithCompliance(page);
    return res.status(200).json({
      data: enriched.map((c) => ({
        ...c,
        daysSinceRegistered: Math.floor(
          (new Date() - (c.registeredAt || c.createdAt)) /
            (1000 * 60 * 60 * 24),
        ),
      })),
      nextCursor,
      hasMore,
    });
  }

  // Offset pagination (default)
  const skip = (parseInt(page) - 1) * pageLimit;
  const [candidates, total] = await Promise.all([
    Candidate.find(filter)
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .populate("agentId", "name")
      .lean(),
    Candidate.countDocuments(filter),
  ]);

  const enriched = await enrichWithCompliance(candidates);
  res.status(200).json({
    data: enriched.map((c) => ({
      ...c,
      daysSinceRegistered: Math.floor(
        (new Date() - (c.registeredAt || c.createdAt)) / (1000 * 60 * 60 * 24),
      ),
    })),
    total,
    page: parseInt(page),
    pages: Math.ceil(total / pageLimit),
  });
});

const createCandidate = asyncHandler(async (req, res) => {
  const {
    fullName,
    fullNameNepali,
    dateOfBirth,
    gender,
    nationalIdNumber,
    phone,
    alternatePhone,
    email,
    permanentProvince,
    permanentDistrict,
    permanentMunicipality,
    permanentWardNo,
    temporaryAddress,
    education,
    skills,
    languagesKnown,
    workExperienceYears,
    previousCountry,
    desiredCountry,
    desiredJobCategory,
    referredBy,
    agentId,
    serviceFeeAgreed,
    serviceFeeReceived,
  } = req.body;

  if (!fullName || !dateOfBirth || !gender || !nationalIdNumber || !phone) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const existingNid = await Candidate.findOne({
    agencyId: req.user.agencyId,
    nationalIdNumber,
  });
  if (existingNid) {
    return res
      .status(400)
      .json({ message: "Candidate with this NID already exists" });
  }

  const existingPhone = await Candidate.findOne({
    agencyId: req.user.agencyId,
    phone,
  });
  if (existingPhone) {
    return res
      .status(400)
      .json({ message: "A candidate with this phone number already exists" });
  }

  if (req.body.passportNumber) {
    const existingPassport = await Candidate.findOne({
      agencyId: req.user.agencyId,
      passportNumber: req.body.passportNumber,
    });
    if (existingPassport) {
      return res.status(400).json({
        message: "A candidate with this passport number already exists",
      });
    }
  }

  if (agentId) {
    const agent = await User.findById(agentId);
    if (
      !agent ||
      agent.role !== "agent" ||
      agent.agencyId.toString() !== req.user.agencyId.toString()
    ) {
      return res.status(400).json({ message: "Invalid agent selected" });
    }
  }

  const paymentStatus =
    serviceFeeReceived >= serviceFeeAgreed
      ? "paid"
      : serviceFeeReceived > 0
        ? "partial"
        : "unpaid";

  const candidate = await Candidate.create(
    scopeData(req, {
      fullName,
      fullNameNepali,
      dateOfBirth,
      gender,
      nationalIdNumber,
      phone,
      alternatePhone,
      email,
      permanentProvince,
      permanentDistrict,
      permanentMunicipality,
      permanentWardNo,
      temporaryAddress,
      education,
      skills,
      languagesKnown,
      workExperienceYears,
      previousCountry,
      desiredCountry,
      desiredJobCategory,
      referredBy,
      agentId,
      serviceFeeAgreed: serviceFeeAgreed || 0,
      serviceFeeReceived: serviceFeeReceived || 0,
      paymentStatus,
      registeredAt: new Date(),
    }),
  );

  const populated = await Candidate.findById(candidate._id).populate(
    "agentId",
    "name",
  );

  res.status(201).json(populated);
});

const getCandidateById = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findOne(
    scopeFilter(req, {
      _id: req.params.id,
    }),
  ).populate("agentId", "name");

  if (!candidate) {
    return res.status(404).json({ message: "Candidate not found" });
  }

  const candidateData = candidate.toObject();
  const passport = await Passport.findOne({ candidateId: candidate._id });
  if (passport) {
    candidateData.passportId = passport._id;

    // Repair: if candidate has no phone but passport has contactPhone, sync it
    if (!candidateData.phone && passport.contactPhone) {
      candidateData.phone = passport.contactPhone;
      await Candidate.findByIdAndUpdate(candidate._id, {
        phone: passport.contactPhone,
      });
    }
  }

  res.status(200).json(candidateData);
});

const updateCandidate = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  delete updates.agencyId;
  delete updates.createdAt;
  delete updates.updatedAt;
  delete updates.status;

  if (updates.nationalIdNumber) {
    const existing = await Candidate.findOne({
      agencyId: req.user.agencyId,
      nationalIdNumber: updates.nationalIdNumber,
      _id: { $ne: req.params.id },
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "NID already exists for another candidate" });
    }
  }

  if (updates.phone) {
    const existing = await Candidate.findOne({
      agencyId: req.user.agencyId,
      phone: updates.phone,
      _id: { $ne: req.params.id },
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Phone number already exists for another candidate" });
    }
  }

  if (updates.passportNumber) {
    const existing = await Candidate.findOne({
      agencyId: req.user.agencyId,
      passportNumber: updates.passportNumber,
      _id: { $ne: req.params.id },
    });
    if (existing) {
      return res.status(400).json({
        message: "Passport number already exists for another candidate",
      });
    }
  }

  if (updates.agentId) {
    const agent = await User.findById(updates.agentId);
    if (
      !agent ||
      agent.role !== "agent" ||
      agent.agencyId.toString() !== req.user.agencyId.toString()
    ) {
      return res.status(400).json({ message: "Invalid agent selected" });
    }
  }

  if (
    updates.serviceFeeReceived !== undefined &&
    updates.serviceFeeAgreed !== undefined
  ) {
    updates.paymentStatus =
      updates.serviceFeeReceived >= updates.serviceFeeAgreed
        ? "paid"
        : updates.serviceFeeReceived > 0
          ? "partial"
          : "unpaid";
  }

  // Handle file uploads (multer.fields populates req.files as an object map)
  const uploadedFiles = req.files || {};
  if (uploadedFiles.visaFile?.[0]) {
    updates.visaFileUrl = uploadedFiles.visaFile[0].path;
  }
  if (uploadedFiles.feimsFile?.[0]) {
    updates.feimsFileUrl = uploadedFiles.feimsFile[0].path;
  }
  if (uploadedFiles.departureFile?.[0]) {
    updates.departureFileUrl = uploadedFiles.departureFile[0].path;
  }
  if (uploadedFiles.file?.[0]) {
    // Legacy generic 'file' field — preserved as visa for backwards compatibility
    updates.visaFileUrl = uploadedFiles.file[0].path;
  }

  const oldCandidate = await Candidate.findById(req.params.id);
  const oldStatus = oldCandidate?.status;

  const candidate = await Candidate.findOneAndUpdate(
    scopeFilter(req, { _id: req.params.id }),
    updates,
    { new: true },
  ).populate("agentId", "name");

  if (!candidate) {
    return res.status(404).json({ message: "Candidate not found" });
  }

  await computeAndSaveCandidateStatus(candidate._id);
  const updatedCandidate = await Candidate.findById(candidate._id).populate(
    "agentId",
    "name",
  );

  if (oldStatus && oldStatus !== updatedCandidate.status) {
    invalidateAlertCache(req.user.agencyId);
    const io = req.app.get("io");
    if (io) {
      const { emitToAgency } = await import("../socket/socketManager.js");
      emitToAgency(io, req.user.agencyId, "candidate_status_changed", {
        candidateId: updatedCandidate._id,
        candidateName: updatedCandidate.fullName,
        oldStatus,
        newStatus: updatedCandidate.status,
        changedBy: req.user.name,
      });
    }

    await logActivity({
      candidateId: candidate._id,
      agencyId: req.user.agencyId,
      userId: req.user.userId,
      userName: req.user.name,
      columnId: "medical",
      action: "status_changed",
      details: `Status changed from ${oldStatus} to ${updatedCandidate.status}`,
      previousValue: oldStatus,
      newValue: updatedCandidate.status,
    });
  }

  // Log visa/feims/departure updates
  if (updates.visaNumber || updates.visaFileUrl) {
    await logActivity({
      candidateId: candidate._id,
      agencyId: req.user.agencyId,
      userId: req.user.userId,
      userName: req.user.name,
      columnId: "visa",
      action: updates.visaFileUrl ? "file_uploaded" : "updated",
      details: updates.visaNumber
        ? `Visa#: ${updates.visaNumber}`
        : "Visa details updated",
      fileUrl: updates.visaFileUrl,
    });
  }

  if (
    updates.shramSwikritiNumber ||
    updates.eStickerNumber ||
    updates.feimsFileUrl
  ) {
    await logActivity({
      candidateId: candidate._id,
      agencyId: req.user.agencyId,
      userId: req.user.userId,
      userName: req.user.name,
      columnId: "feims",
      action: updates.feimsFileUrl ? "file_uploaded" : "updated",
      details: updates.shramSwikritiNumber
        ? `Shram Swikriti#: ${updates.shramSwikritiNumber}`
        : "FEIMS details updated",
      fileUrl: updates.feimsFileUrl,
    });
  }

  if (updates.flightDate || updates.flightNumber || updates.departureFileUrl) {
    await logActivity({
      candidateId: candidate._id,
      agencyId: req.user.agencyId,
      userId: req.user.userId,
      userName: req.user.name,
      columnId: "departure",
      action: updates.departureFileUrl ? "file_uploaded" : "updated",
      details: updates.flightNumber
        ? `Flight: ${updates.flightNumber}`
        : "Departure details updated",
      fileUrl: updates.departureFileUrl,
    });
  }

  res.status(200).json(updatedCandidate);
});

const deleteCandidate = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res
      .status(403)
      .json({ message: "Insufficient permissions to delete candidates" });
  }

  const candidate = await Candidate.findOne(
    scopeFilter(req, {
      _id: req.params.id,
    }),
  );

  if (!candidate) {
    return res.status(404).json({ message: "Candidate not found" });
  }

  // CASCADING CLEANUP (Since transactions are not supported, we do sequential steps)

  // 1. Revert Passport to in_pool
  if (candidate.passportId || candidate.passportNumber) {
    const passportFilter = { agencyId: req.user.agencyId };
    if (candidate.passportId) passportFilter._id = candidate.passportId;
    else passportFilter.passportNumber = candidate.passportNumber;

    await Passport.findOneAndUpdate(passportFilter, {
      $set: {
        allocationStatus: "in_pool",
        candidateId: null,
        allocatedToDemandId: null,
        allocatedAt: null,
        allocatedBy: null,
      },
    });
  }

  // 2. Decrement JobDemand filledPositions
  if (candidate.demandId) {
    await JobDemand.findByIdAndUpdate(candidate.demandId, {
      $inc: { filledPositions: -1 },
    });
  }

  // 3. Delete all related records
  await Promise.all([
    Medical.deleteMany({ candidateId: candidate._id }),
    Orientation.deleteMany({ candidateId: candidate._id }),
    InsuranceSsf.deleteMany({ candidateId: candidate._id }),
    FeeTransaction.deleteMany({ candidateId: candidate._id }),
    Task.deleteMany({ candidateId: candidate._id }),
    // Delete candidate itself
    Candidate.findByIdAndDelete(candidate._id),
  ]);

  res
    .status(200)
    .json({ message: "Candidate and all related data deleted successfully" });
});

const getAgents = asyncHandler(async (req, res) => {
  const agents = await User.find({
    agencyId: req.user.agencyId,
    role: "agent",
    isActive: true,
  })
    .select("_id name")
    .lean();

  res.status(200).json(agents);
});

const exportCandidates = asyncHandler(async (req, res) => {
  const { status, desiredCountry, agentId, format = "csv" } = req.query;

  const filter = { agencyId: req.user.agencyId };
  if (status) filter.status = status;
  if (desiredCountry) filter.desiredCountry = desiredCountry;
  if (agentId) filter.agentId = agentId;

  const candidates = await Candidate.find(filter)
    .populate("agentId", "name")
    .sort({ registeredAt: -1 })
    .lean();

  if (format === "json") {
    return res.status(200).json(candidates);
  }

  const headers = [
    "Full Name",
    "Phone",
    "NID",
    "Status",
    "Country",
    "Job Category",
    "Agent",
    "Service Fee",
    "Paid",
    "Registered Date",
  ];

  const rows = candidates.map((c) => [
    c.fullName,
    c.phone,
    c.nationalIdNumber,
    c.status,
    c.desiredCountry,
    c.desiredJobCategory,
    c.agentId?.name || "",
    c.serviceFeeAgreed || 0,
    c.serviceFeeReceived || 0,
    c.registeredAt ? new Date(c.registeredAt).toLocaleDateString() : "",
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      r.map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=candidates-${Date.now()}.csv`,
  );
  res.status(200).send(csv);
});

const getCandidateKanban = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agencyId = req.user.agencyId;

  const candidate = await Candidate.findOne({ _id: id, agencyId })
    .populate("agentId", "name")
    .populate("demandId")
    .populate("passportId")
    .lean();

  if (!candidate) {
    return res.status(404).json({ message: "Candidate not found" });
  }

  const [medical, orientation, insuranceSsf, feeTransactions] =
    await Promise.all([
      Medical.findOne({ candidateId: id }).sort({ createdAt: -1 }),
      Orientation.findOne({ candidateId: id }).sort({ createdAt: -1 }),
      InsuranceSsf.findOne({ candidateId: id }).sort({ createdAt: -1 }),
      FeeTransaction.find({
        candidateId: id,
        transactionType: "service_fee",
        direction: "received",
      })
        .sort({ paidAt: -1 })
        .limit(20),
    ]);

  let demand = null;
  if (candidate.demandId) {
    demand = await JobDemand.findById(candidate.demandId).lean();
  }

  let passport = null;
  if (candidate.passportId) {
    passport = await Passport.findById(candidate.passportId).lean();
  } else if (candidate.passportNumber) {
    passport = await Passport.findOne({
      passportNumber: candidate.passportNumber,
      agencyId,
    }).lean();
  }

  const checklistMap = candidate.documentChecklist?.toObject?.() || {};
  const stageNotes = candidate.stageNotes?.toObject?.() || {};

  // 10-column 5-phase workflow
  const passportCollectionColumn = buildPassportCollectionColumn(
    passport,
    checklistMap,
    stageNotes,
  );
  const medicalColumn = buildMedicalColumn(medical, checklistMap, stageNotes);
  const insuranceColumn = buildInsuranceColumn(
    insuranceSsf,
    checklistMap,
    stageNotes,
  );
  const callingVisaColumn = buildCallingVisaColumn(
    candidate,
    demand,
    checklistMap,
    stageNotes,
  );
  const visaColumn = buildVisaColumn(
    candidate,
    passport,
    checklistMap,
    stageNotes,
  );
  const feeColumn = buildFeeColumn(
    feeTransactions,
    candidate.serviceFeeAgreed,
    checklistMap,
    stageNotes,
  );
  const flightColumn = buildFlightColumn(candidate, checklistMap, stageNotes);
  const dofeColumn = buildDofeColumn(
    candidate,
    medical,
    orientation,
    insuranceSsf,
    checklistMap,
    stageNotes,
  );
  const docPrepColumn = buildDocPrepColumn(candidate, checklistMap, stageNotes);
  const departureColumn = buildDepartureColumn(
    candidate,
    checklistMap,
    stageNotes,
  );

  const columns = [
    passportCollectionColumn, // Phase 1
    medicalColumn, // Phase 1
    insuranceColumn, // Phase 2
    callingVisaColumn, // Phase 2
    visaColumn, // Phase 2
    feeColumn, // Phase 2
    flightColumn, // Phase 3
    dofeColumn, // Phase 4
    docPrepColumn, // Phase 5
    departureColumn, // Phase 5
  ];
  const completeCount = columns.filter((c) => c.status === "complete").length;

  res.status(200).json({
    candidate: {
      ...candidate,
      agentName: candidate.agentId?.name || candidate.agentName || "",
      demandCountry: demand?.employerCountry || candidate.desiredCountry || "",
      demandCompany: demand?.employerCompanyName || "",
      demandJobCategory:
        demand?.jobCategory || candidate.desiredJobCategory || "",
    },
    passport,
    demand,
    columns,
    overallProgress: {
      complete: completeCount,
      total: 10,
      percent: Math.round((completeCount / 10) * 100),
      nextAction: getNextAction(columns),
      blockedBy: getBlockedBy(columns),
    },
  });
});

// ─── Phase 1: Passport Collection ──────────────────────────────────────────
const buildPassportCollectionColumn = (
  passport,
  checklistMap = {},
  stageNotes = {},
) => {
  const withAgency = passport?.custodyStatus === "with_agency";
  const checkItems = [
    {
      key: "passport_received",
      label: "Passport received from candidate",
      ...getChecklistMeta(
        checklistMap,
        "passport_collection",
        "passport_received",
        withAgency,
      ),
    },
    {
      key: "passport_verified",
      label: "Passport details verified",
      ...getChecklistMeta(
        checklistMap,
        "passport_collection",
        "passport_verified",
        withAgency && !!passport?.passportNumber,
      ),
    },
    {
      key: "passport_renewed",
      label: "Renewal done (if needed)",
      ...getChecklistMeta(
        checklistMap,
        "passport_collection",
        "passport_renewed",
        false,
      ),
    },
  ];

  let status = "pending";
  if (passport) {
    if (passport.custodyStatus === "submitted_embassy") status = "in_progress";
    else if (passport.custodyStatus === "with_agency")
      status = checkItems.every((i) => i.done) ? "complete" : "in_progress";
    else status = "in_progress";
  }

  let daysUntilExpiry = null;
  if (passport?.expiryDate) {
    daysUntilExpiry = Math.ceil(
      (new Date(passport.expiryDate) - new Date()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilExpiry < 0) status = "expired";
    else if (daysUntilExpiry < 180 && status !== "pending") status = "expiring";
  }

  return {
    id: "passport_collection",
    title: "Passport Collection",
    subtitle: passport?.passportNumber || "No passport linked",
    icon: "passport",
    phase: 1,
    phaseLabel: "Phase 1 — Pre-processing",
    status,
    requiredFor: "Medical check",
    data: passport,
    uploads: passport?.scannedImageUrl
      ? [{ label: "Passport Scan", url: passport.scannedImageUrl }]
      : [],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: passport?.updatedAt || null,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: passport?.expiryDate || null,
    daysUntilExpiry,
    note: stageNotes["passport_collection"] || "",
    canEdit: false,
    canDelete: false,
  };
};

// ─── Phase 1: Medical Check ─────────────────────────────────────────────────
const buildMedicalColumn = (medical, checklistMap = {}, stageNotes = {}) => {
  const checkItems = [
    {
      key: "medical_scheduled",
      label: "Medical scheduled",
      ...getChecklistMeta(
        checklistMap,
        "medical",
        "medical_scheduled",
        !!medical?.scheduledDate,
      ),
    },
    {
      key: "medical_conducted",
      label: "Medical conducted",
      ...getChecklistMeta(
        checklistMap,
        "medical",
        "medical_conducted",
        !!medical?.conductedDate,
      ),
    },
    {
      key: "result_received",
      label: "Result received",
      ...getChecklistMeta(
        checklistMap,
        "medical",
        "result_received",
        !!medical?.result && medical.result !== "pending",
      ),
    },
    {
      key: "report_uploaded",
      label: "Report uploaded",
      ...getChecklistMeta(
        checklistMap,
        "medical",
        "report_uploaded",
        !!medical?.reportFileUrl,
      ),
    },
  ];

  let status = "pending";
  if (medical) {
    if (medical.result === "unfit") status = "blocked";
    else if (medical.result === "fit" && medical.reportFileUrl)
      status = "complete";
    else if (medical.scheduledDate || medical.conductedDate)
      status = "in_progress";
  }

  let daysUntilExpiry = null;
  if (medical?.reportExpiryDate) {
    daysUntilExpiry = Math.ceil(
      (new Date(medical.reportExpiryDate) - new Date()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilExpiry < 0) status = "expired";
    else if (daysUntilExpiry < 30 && status === "complete") status = "expiring";
  }

  return {
    id: "medical",
    title: "Medical clearance",
    subtitle: "GAMCA or Wafid",
    icon: "stethoscope",
    status,
    requiredFor: "FEIMS submission",
    data: medical,
    uploads: medical?.reportFileUrl
      ? [{ label: "Medical Report", url: medical.reportFileUrl }]
      : [],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: medical?.updatedAt || null,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: medical?.reportExpiryDate || null,
    daysUntilExpiry,
    note: stageNotes["medical"] || "",
    canEdit: true,
    canDelete: true,
  };
};

// ─── Phase 2: Insurance & SSF ───────────────────────────────────────────────
const buildInsuranceColumn = (
  insuranceSsf,
  checklistMap = {},
  stageNotes = {},
) => {
  const checkItems = [
    {
      key: "insurance_paid",
      label: "Insurance paid",
      ...getChecklistMeta(
        checklistMap,
        "insurance",
        "insurance_paid",
        !!insuranceSsf?.insurancePaidDate,
      ),
    },
    {
      key: "policy_generated",
      label: "Policy generated",
      ...getChecklistMeta(
        checklistMap,
        "insurance",
        "policy_generated",
        !!insuranceSsf?.insurancePolicyNumber,
      ),
    },
    {
      key: "ssf_registered",
      label: "SSF registered",
      ...getChecklistMeta(
        checklistMap,
        "insurance",
        "ssf_registered",
        !!insuranceSsf?.ssfPaidDate,
      ),
    },
    {
      key: "ssf_receipt",
      label: "SSF receipt",
      ...getChecklistMeta(
        checklistMap,
        "insurance",
        "ssf_receipt",
        !!insuranceSsf?.ssfReceiptNumber,
      ),
    },
  ];

  let status = "pending";
  if (insuranceSsf) {
    if (insuranceSsf.overallStatus === "completed") status = "complete";
    else if (insuranceSsf.overallStatus === "partially_done")
      status = "in_progress";
  }

  let daysUntilExpiry = null;
  if (insuranceSsf?.insuranceExpiryDate) {
    daysUntilExpiry = Math.ceil(
      (new Date(insuranceSsf.insuranceExpiryDate) - new Date()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysUntilExpiry < 0) status = "expired";
    else if (daysUntilExpiry < 30 && status === "complete") status = "expiring";
  }

  return {
    id: "insurance",
    title: "Insurance & SSF",
    subtitle: "Social Security Fund",
    icon: "shield",
    phase: 2,
    phaseLabel: "Phase 2 — Insurance & Visa",
    status,
    requiredFor: "Calling visa",
    data: insuranceSsf,
    uploads: [
      ...(insuranceSsf?.insurancePaidReceiptUrl
        ? [
            {
              label: "Insurance Receipt",
              url: insuranceSsf.insurancePaidReceiptUrl,
            },
          ]
        : []),
      ...(insuranceSsf?.ssfReceiptUrl
        ? [{ label: "SSF Receipt", url: insuranceSsf.ssfReceiptUrl }]
        : []),
    ],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: insuranceSsf?.updatedAt || null,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: insuranceSsf?.insuranceExpiryDate || null,
    daysUntilExpiry,
    note: stageNotes["insurance"] || "",
    canEdit: true,
    canDelete: true,
  };
};

// ─── Phase 2: Calling Visa (Demand Letter) ──────────────────────────────────
const buildCallingVisaColumn = (
  candidate,
  demand,
  checklistMap = {},
  stageNotes = {},
) => {
  const checkItems = [
    {
      key: "demand_letter_confirmed",
      label: "Demand letter confirmed",
      ...getChecklistMeta(
        checklistMap,
        "calling_visa",
        "demand_letter_confirmed",
        !!candidate.demandId,
      ),
    },
    {
      key: "visa_number_obtained",
      label: "Visa number obtained from employer",
      ...getChecklistMeta(
        checklistMap,
        "calling_visa",
        "visa_number_obtained",
        !!candidate.visaNumber,
      ),
    },
    {
      key: "visa_approval_confirmed",
      label: "Visa approval confirmed",
      ...getChecklistMeta(
        checklistMap,
        "calling_visa",
        "visa_approval_confirmed",
        false,
      ),
    },
  ];

  let status = "pending";
  if (candidate.demandId) {
    if (candidate.visaNumber)
      status = checkItems.every((i) => i.done) ? "complete" : "in_progress";
    else status = "in_progress";
  }

  return {
    id: "calling_visa",
    title: "Calling Visa",
    subtitle: demand?.employerCountry
      ? `Demand: ${demand.employerCountry}`
      : "Employer demand letter",
    icon: "file",
    phase: 2,
    phaseLabel: "Phase 2 — Insurance & Visa",
    status,
    requiredFor: "Visa stamping",
    data: {
      demandId: candidate.demandId,
      visaNumber: candidate.visaNumber,
      visaReceivedDate: candidate.visaReceivedDate,
      demandCountry: demand?.employerCountry || "",
      demandCompany: demand?.employerCompanyName || "",
    },
    uploads: [],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: candidate.updatedAt || null,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: null,
    daysUntilExpiry: null,
    note: stageNotes["calling_visa"] || "",
    canEdit: true,
    canDelete: false,
  };
};

// ─── Phase 2: Visa Stamping ─────────────────────────────────────────────────
const buildVisaColumn = (
  candidate,
  passport,
  checklistMap = {},
  stageNotes = {},
) => {
  const checkItems = [
    {
      key: "embassy_submitted",
      label: "Passport submitted to embassy",
      ...getChecklistMeta(
        checklistMap,
        "visa",
        "embassy_submitted",
        passport?.custodyStatus === "submitted_embassy",
      ),
    },
    {
      key: "visa_stamped",
      label: "Visa stamped on passport",
      ...getChecklistMeta(
        checklistMap,
        "visa",
        "visa_stamped",
        !!candidate.visaFileUrl,
      ),
    },
    {
      key: "passport_returned",
      label: "Passport returned to office",
      ...getChecklistMeta(
        checklistMap,
        "visa",
        "passport_returned",
        !!candidate.visaFileUrl && passport?.custodyStatus === "with_agency",
      ),
    },
  ];

  let status = "pending";
  if (candidate.visaNumber) {
    if (candidate.visaFileUrl) status = "complete";
    else if (passport?.custodyStatus === "submitted_embassy")
      status = "in_progress";
    else status = "in_progress";
  }

  return {
    id: "visa",
    title: "Visa Stamping",
    subtitle: "Embassy visa stamp",
    icon: "stamp",
    phase: 2,
    phaseLabel: "Phase 2 — Insurance & Visa",
    status,
    requiredFor: "Flight booking",
    data: {
      visaNumber: candidate.visaNumber,
      visaReceivedDate: candidate.visaReceivedDate,
      visaExpiryDate: candidate.visaExpiryDate,
      visaFileUrl: candidate.visaFileUrl,
    },
    uploads: candidate.visaFileUrl
      ? [{ label: "Visa Document", url: candidate.visaFileUrl }]
      : [],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: candidate.updatedAt || null,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: candidate.visaExpiryDate || null,
    daysUntilExpiry: candidate.visaExpiryDate
      ? Math.ceil(
          (new Date(candidate.visaExpiryDate) - new Date()) /
            (1000 * 60 * 60 * 24),
        )
      : null,
    note: stageNotes["visa"] || "",
    canEdit: true,
    canDelete: true,
  };
};

// ─── Phase 2: Service Fee ───────────────────────────────────────────────────
const buildFeeColumn = (
  transactions,
  serviceFeeAgreed,
  checklistMap = {},
  stageNotes = {},
) => {
  const totalReceived = transactions.reduce((sum, t) => sum + t.amountNPR, 0);
  const checkItems = [
    {
      key: "fee_agreed",
      label: "Fee agreed",
      ...getChecklistMeta(
        checklistMap,
        "fee",
        "fee_agreed",
        !!serviceFeeAgreed,
      ),
    },
    {
      key: "partial_payment",
      label: "Partial payment",
      ...getChecklistMeta(
        checklistMap,
        "fee",
        "partial_payment",
        totalReceived > 0,
      ),
    },
    {
      key: "full_payment",
      label: "Full payment",
      ...getChecklistMeta(
        checklistMap,
        "fee",
        "full_payment",
        totalReceived >= (serviceFeeAgreed || 0),
      ),
    },
    {
      key: "receipt_issued",
      label: "Receipt issued",
      ...getChecklistMeta(
        checklistMap,
        "fee",
        "receipt_issued",
        transactions.some((t) => t.receiptUrl),
      ),
    },
  ];
  const feeLastUpdatedAt = transactions.reduce((latest, t) => {
    const ts = t?.updatedAt || t?.createdAt || t?.paidAt;
    return ts && (!latest || new Date(ts) > new Date(latest)) ? ts : latest;
  }, null);

  let status = "pending";
  if (transactions.length > 0) {
    if (totalReceived >= (serviceFeeAgreed || 0)) status = "complete";
    else status = "in_progress";
  }

  return {
    id: "fee",
    title: "Service Fee",
    subtitle: "Payment collection",
    icon: "rupee",
    phase: 2,
    phaseLabel: "Phase 2 — Insurance & Visa",
    status,
    requiredFor: "Visa processing",
    data: { transactions, totalReceived, serviceFeeAgreed },
    uploads: transactions
      .filter((t) => t.receiptUrl)
      .slice(0, 3)
      .map((t, idx) => ({ label: `Receipt ${idx + 1}`, url: t.receiptUrl })),
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: feeLastUpdatedAt,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: null,
    daysUntilExpiry: null,
    note: stageNotes["fee"] || "",
    canEdit: true,
    canDelete: false,
  };
};

// ─── Phase 3: Flight Booking ────────────────────────────────────────────────
const buildFlightColumn = (candidate, checklistMap = {}, stageNotes = {}) => {
  const checkItems = [
    {
      key: "ticket_booked",
      label: "Flight ticket booked",
      ...getChecklistMeta(
        checklistMap,
        "flight",
        "ticket_booked",
        !!candidate.flightDate,
      ),
    },
    {
      key: "ticket_confirmed",
      label: "Flight number confirmed",
      ...getChecklistMeta(
        checklistMap,
        "flight",
        "ticket_confirmed",
        !!candidate.flightNumber,
      ),
    },
    {
      key: "airline_confirmed",
      label: "Airline confirmed",
      ...getChecklistMeta(
        checklistMap,
        "flight",
        "airline_confirmed",
        !!candidate.airline,
      ),
    },
    {
      key: "airport_time_set",
      label: "Airport report time set",
      ...getChecklistMeta(
        checklistMap,
        "flight",
        "airport_time_set",
        !!candidate.airportReportingTime,
      ),
    },
  ];

  let status = "pending";
  if (candidate.flightDate) {
    status =
      candidate.flightNumber && candidate.airline ? "complete" : "in_progress";
  }

  return {
    id: "flight",
    title: "Flight Booking",
    subtitle: candidate.flightDate
      ? `${candidate.airline || ""} ${candidate.flightNumber || ""}`.trim() ||
        new Date(candidate.flightDate).toLocaleDateString("en-GB")
      : "Book departure flight",
    icon: "plane",
    phase: 3,
    phaseLabel: "Phase 3 — Travel Booking",
    status,
    requiredFor: "DoFE clearance",
    data: {
      flightDate: candidate.flightDate,
      flightNumber: candidate.flightNumber,
      airline: candidate.airline,
      airportReportingTime: candidate.airportReportingTime,
    },
    uploads: candidate.departureFileUrl
      ? [{ label: "Flight Ticket", url: candidate.departureFileUrl }]
      : [],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: candidate.updatedAt || null,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: candidate.flightDate || null,
    daysUntilExpiry: candidate.flightDate
      ? Math.ceil(
          (new Date(candidate.flightDate) - new Date()) / (1000 * 60 * 60 * 24),
        )
      : null,
    note: stageNotes["flight"] || "",
    canEdit: true,
    canDelete: false,
  };
};

// ─── Phase 4: DoFE / FEIMS Clearance ────────────────────────────────────────
const buildDofeColumn = (
  candidate,
  medical,
  orientation,
  insuranceSsf,
  checklistMap = {},
  stageNotes = {},
) => {
  const medicalValid =
    medical?.result === "fit" &&
    (!medical?.reportExpiryDate ||
      new Date(medical.reportExpiryDate) > new Date());

  const checkItems = [
    {
      key: "orientation_certified",
      label: "Orientation certified (PDOT)",
      ...getChecklistMeta(
        checklistMap,
        "dofe",
        "orientation_certified",
        orientation?.completionStatus === "completed" &&
          !!orientation?.certificateFileUrl,
      ),
    },
    {
      key: "insurance_verified",
      label: "Insurance verified at DoFE",
      ...getChecklistMeta(
        checklistMap,
        "dofe",
        "insurance_verified",
        insuranceSsf?.overallStatus === "completed",
      ),
    },
    {
      key: "medical_cert_valid",
      label: "Medical certificate valid",
      ...getChecklistMeta(
        checklistMap,
        "dofe",
        "medical_cert_valid",
        medicalValid,
      ),
    },
    {
      key: "ssf_confirmed",
      label: "SSF (Social Security Fund)",
      ...getChecklistMeta(
        checklistMap,
        "dofe",
        "ssf_confirmed",
        !!insuranceSsf?.ssfReceiptNumber,
      ),
    },
    {
      key: "shram_received",
      label: "Shram Swikriti received",
      ...getChecklistMeta(
        checklistMap,
        "dofe",
        "shram_received",
        !!candidate.shramSwikritiNumber,
      ),
    },
    {
      key: "e_sticker_received",
      label: "E-Sticker received",
      ...getChecklistMeta(
        checklistMap,
        "dofe",
        "e_sticker_received",
        !!candidate.eStickerNumber,
      ),
    },
  ];

  let status = "pending";
  if (candidate.shramSwikritiNumber && candidate.eStickerNumber) {
    status = "complete";
  } else if (
    orientation ||
    candidate.shramSwikritiNumber ||
    candidate.eStickerNumber
  ) {
    status = "in_progress";
  }

  return {
    id: "dofe",
    title: "DoFE Clearance",
    subtitle: candidate.shramSwikritiNumber
      ? `Shram: ${candidate.shramSwikritiNumber}`
      : "Shram Swikriti",
    icon: "shield-check",
    phase: 4,
    phaseLabel: "Phase 4 — DoFE / FEIMS Clearance",
    status,
    requiredFor: "Final departure",
    data: {
      shramSwikritiNumber: candidate.shramSwikritiNumber,
      eStickerNumber: candidate.eStickerNumber,
      feimsSubmittedAt: candidate.feimsSubmittedAt,
      feimsFileUrl: candidate.feimsFileUrl,
      orientation: orientation || null,
    },
    uploads: [
      ...(candidate.feimsFileUrl
        ? [{ label: "FEIMS Document", url: candidate.feimsFileUrl }]
        : []),
      ...(orientation?.certificateFileUrl
        ? [
            {
              label: "Orientation Certificate",
              url: orientation.certificateFileUrl,
            },
          ]
        : []),
    ],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: candidate.updatedAt || null,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: null,
    daysUntilExpiry: null,
    note: stageNotes["dofe"] || "",
    canEdit: true,
    canDelete: false,
  };
};

// ─── Phase 5: Document Preparation ─────────────────────────────────────────
const buildDocPrepColumn = (candidate, checklistMap = {}, stageNotes = {}) => {
  const checkItems = [
    {
      key: "all_docs_compiled",
      label: "All documents compiled",
      ...getChecklistMeta(checklistMap, "doc_prep", "all_docs_compiled", false),
    },
    {
      key: "ticket_ready",
      label: "Flight ticket printed / ready",
      ...getChecklistMeta(checklistMap, "doc_prep", "ticket_ready", false),
    },
    {
      key: "briefing_done",
      label: "Pre-departure briefing done",
      ...getChecklistMeta(checklistMap, "doc_prep", "briefing_done", false),
    },
    {
      key: "docs_handed",
      label: "Docs handed to candidate",
      ...getChecklistMeta(checklistMap, "doc_prep", "docs_handed", false),
    },
  ];

  const completedCount = checkItems.filter((i) => i.done).length;
  let status = "pending";
  if (completedCount === checkItems.length) status = "complete";
  else if (completedCount > 0) status = "in_progress";

  return {
    id: "doc_prep",
    title: "Document Prep",
    subtitle: "Pre-departure checklist",
    icon: "clipboard",
    phase: 5,
    phaseLabel: "Phase 5 — Final Departure",
    status,
    requiredFor: "Final departure",
    data: null,
    uploads: [],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: null,
    checkItems,
    completedCount,
    totalCount: checkItems.length,
    expiryDate: null,
    daysUntilExpiry: null,
    note: stageNotes["doc_prep"] || "",
    canEdit: false,
    canDelete: false,
  };
};

// ─── Phase 5: Final Departure ───────────────────────────────────────────────
const buildDepartureColumn = (
  candidate,
  checklistMap = {},
  stageNotes = {},
) => {
  const checkItems = [
    {
      key: "airport_reported",
      label: "Reported at airport",
      ...getChecklistMeta(checklistMap, "departure", "airport_reported", false),
    },
    {
      key: "flight_departed",
      label: "Flight departed",
      ...getChecklistMeta(
        checklistMap,
        "departure",
        "flight_departed",
        !!candidate.departedAt,
      ),
    },
    {
      key: "confirmation_received",
      label: "Safe arrival confirmed",
      ...getChecklistMeta(
        checklistMap,
        "departure",
        "confirmation_received",
        false,
      ),
    },
  ];

  let status = "pending";
  if (candidate.departedAt) status = "complete";
  else if (candidate.departureStatus === "scheduled") status = "in_progress";

  return {
    id: "departure",
    title: "Final Departure",
    subtitle: candidate.flightDate
      ? new Date(candidate.flightDate).toLocaleDateString("en-GB")
      : "Departure date",
    icon: "plane-takeoff",
    phase: 5,
    phaseLabel: "Phase 5 — Final Departure",
    status,
    requiredFor: "Completion",
    data: {
      flightDate: candidate.flightDate,
      flightNumber: candidate.flightNumber,
      airline: candidate.airline,
      airportReportingTime: candidate.airportReportingTime,
      departureStatus: candidate.departureStatus,
      departedAt: candidate.departedAt,
    },
    uploads: [],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: candidate.departedAt || candidate.updatedAt || null,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: candidate.flightDate || null,
    daysUntilExpiry: candidate.flightDate
      ? Math.ceil(
          (new Date(candidate.flightDate) - new Date()) / (1000 * 60 * 60 * 24),
        )
      : null,
    note: stageNotes["departure"] || "",
    canEdit: true,
    canDelete: false,
  };
};

const getNextAction = (columns) => {
  const pending = columns.find((c) => c.status === "pending");
  const inProgress = columns.find((c) => c.status === "in_progress");

  if (pending) {
    const actions = {
      passport_collection: "Collect passport from candidate",
      medical: "Schedule GAMCA/Wafid medical check",
      insurance: "Complete insurance & SSF payment",
      calling_visa: "Confirm demand letter & visa number",
      visa: "Submit passport to embassy for stamping",
      fee: "Collect service fee",
      flight: "Book departure flight",
      dofe: "Submit for DoFE/FEIMS clearance (Shram)",
      doc_prep: "Compile all pre-departure documents",
      departure: "Confirm final departure",
    };
    return actions[pending.id] || `Start ${pending.title}`;
  }
  if (inProgress) {
    return `Complete ${inProgress.title} requirements`;
  }
  return null;
};

const getBlockedBy = (columns) => {
  const blocked = columns.find((c) => c.status === "blocked");
  if (blocked?.id === "medical" && blocked.data?.result === "unfit") {
    return "Medical result: UNFIT — Schedule recheck";
  }
  return null;
};

const markColumnComplete = asyncHandler(async (req, res) => {
  const { id: candidateId } = req.params;
  const { columnId } = req.body;
  const { agencyId, userId, name: userName } = req.user;

  const validColumns = [
    "passport_collection",
    "medical",
    "insurance",
    "calling_visa",
    "visa",
    "fee",
    "flight",
    "dofe",
    "doc_prep",
    "departure",
  ];
  if (!columnId || !validColumns.includes(columnId)) {
    return res.status(400).json({ message: "Invalid column ID" });
  }

  const candidate = await Candidate.findOne({ _id: candidateId, agencyId });
  if (!candidate) {
    return res.status(404).json({ message: "Candidate not found" });
  }

  const columnTitles = {
    passport_collection: "Passport Collection",
    medical: "Medical Check",
    insurance: "Insurance & SSF",
    calling_visa: "Calling Visa",
    visa: "Visa Stamping",
    fee: "Service Fee",
    flight: "Flight Booking",
    dofe: "DoFE Clearance",
    doc_prep: "Document Preparation",
    departure: "Final Departure",
  };

  const actionDetails = {
    passport_collection: "Passport collection marked complete",
    medical: "Medical check marked complete",
    insurance: "Insurance & SSF marked complete",
    calling_visa: "Calling visa marked complete",
    visa: "Visa stamping marked complete",
    fee: "Service fee marked complete",
    flight: "Flight booking marked complete",
    dofe: "DoFE clearance marked complete",
    doc_prep: "Document preparation marked complete",
    departure: "Final departure marked complete",
  };

  let newStatus = candidate.status;
  const statusMapping = {
    passport_collection: "passport_collected",
    medical: "medical_passed",
    insurance: "insurance_done",
    calling_visa: "visa_applied",
    visa: "visa_stamped",
    flight: "flight_booked",
    dofe: "shram_issued",
    departure: "departed",
  };

  if (statusMapping[columnId]) {
    newStatus = statusMapping[columnId];
    const statusUpdate = { status: newStatus };
    if (columnId === "departure") {
      statusUpdate.departedAt = new Date();
      statusUpdate.departureStatus = "completed";
    }
    await candidate.updateOne(statusUpdate);
    await computeAndSaveCandidateStatus(candidateId);
    invalidateAlertCache(agencyId);
  }

  await CandidateActivityLog.create({
    candidateId,
    agencyId,
    performedBy: userId,
    performerName: userName,
    columnId,
    action: "marked_complete",
    details: `${columnTitles[columnId]} marked as complete by ${userName}`,
    previousValue: candidate.status,
    newValue: newStatus,
  });

  await candidate.updateOne({ lastStatusUpdateAt: new Date() });

  res.status(200).json({
    message: `${columnTitles[columnId]} marked as complete`,
    newStatus,
    columnId,
  });
});

const toggleChecklistItem = asyncHandler(async (req, res) => {
  const { id: candidateId } = req.params;
  const { columnId, itemKey, done } = req.body;
  const { agencyId, userId, name: userName } = req.user;

  const validColumns = Object.keys(DOCUMENT_CHECKLIST_KEYS);
  if (!columnId || !validColumns.includes(columnId)) {
    return res.status(400).json({ message: "Invalid column ID" });
  }

  const validItems = DOCUMENT_CHECKLIST_KEYS[columnId];
  if (!itemKey || !validItems.includes(itemKey)) {
    return res.status(400).json({ message: "Invalid checklist item key" });
  }

  const candidate = await Candidate.findOne({ _id: candidateId, agencyId });
  if (!candidate) {
    return res.status(404).json({ message: "Candidate not found" });
  }

  const normalizedDone =
    typeof done === "boolean"
      ? done
      : !candidate.documentChecklist?.get(`${columnId}__${itemKey}`);
  const mapKey = `${columnId}__${itemKey}`;
  candidate.documentChecklist.set(mapKey, normalizedDone);
  await candidate.save();

  const selectedItem = itemKey.replace(/_/g, " ");
  await CandidateActivityLog.create({
    candidateId,
    agencyId,
    performedBy: userId,
    performerName: userName,
    columnId: "document",
    action: "updated",
    details: `${columnId.toUpperCase()} checklist: "${selectedItem}" marked ${normalizedDone ? "complete" : "incomplete"} by ${userName}`,
    previousValue: String(!normalizedDone),
    newValue: String(normalizedDone),
  });

  res.status(200).json({
    message: "Checklist item updated",
    columnId,
    itemKey,
    done: normalizedDone,
  });
});

const resetChecklistColumn = asyncHandler(async (req, res) => {
  const { id: candidateId } = req.params;
  const { columnId } = req.body;
  const { agencyId, userId, name: userName } = req.user;

  const validColumns = Object.keys(DOCUMENT_CHECKLIST_KEYS);
  if (!columnId || !validColumns.includes(columnId)) {
    return res.status(400).json({ message: "Invalid column ID" });
  }

  const candidate = await Candidate.findOne({ _id: candidateId, agencyId });
  if (!candidate) {
    return res.status(404).json({ message: "Candidate not found" });
  }

  for (const itemKey of DOCUMENT_CHECKLIST_KEYS[columnId]) {
    candidate.documentChecklist.delete(`${columnId}__${itemKey}`);
  }
  await candidate.save();

  await CandidateActivityLog.create({
    candidateId,
    agencyId,
    performedBy: userId,
    performerName: userName,
    columnId: "document",
    action: "updated",
    details: `${columnId.toUpperCase()} checklist reset to auto-calculated values by ${userName}`,
  });

  res.status(200).json({ message: "Checklist reset to auto values", columnId });
});

const getCandidateActivityLogs = asyncHandler(async (req, res) => {
  const { id: candidateId } = req.params;
  const { columnId, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = scopeFilter(req, { candidateId });
  if (columnId) {
    filter.columnId = columnId;
  }

  const [logs, total] = await Promise.all([
    CandidateActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("performedBy", "name")
      .lean(),
    CandidateActivityLog.countDocuments(filter),
  ]);

  res.status(200).json({
    data: logs,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

const saveStageNote = asyncHandler(async (req, res) => {
  const { id: candidateId } = req.params;
  const { columnId, note } = req.body;
  const { agencyId, userId, name: userName } = req.user;

  const validColumns = Object.keys(DOCUMENT_CHECKLIST_KEYS);
  if (!columnId || !validColumns.includes(columnId)) {
    return res.status(400).json({ message: "Invalid column ID" });
  }

  const candidate = await Candidate.findOne({ _id: candidateId, agencyId });
  if (!candidate) {
    return res.status(404).json({ message: "Candidate not found" });
  }

  const trimmedNote = (note || "").trim();
  if (trimmedNote) {
    candidate.stageNotes.set(columnId, trimmedNote);
  } else {
    candidate.stageNotes.delete(columnId);
  }
  await candidate.save();

  await CandidateActivityLog.create({
    candidateId,
    agencyId,
    performedBy: userId,
    performerName: userName,
    columnId,
    action: "updated",
    details: trimmedNote
      ? `Note added to ${columnId.toUpperCase()} by ${userName}: "${trimmedNote.substring(0, 80)}${trimmedNote.length > 80 ? "..." : ""}"`
      : `Note removed from ${columnId.toUpperCase()} by ${userName}`,
  });

  res.status(200).json({ message: "Note saved", columnId, note: trimmedNote });
});

export default {
  getCandidates,
  createCandidate,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
  getAgents,
  exportCandidates,
  getCandidateKanban,
  markColumnComplete,
  toggleChecklistItem,
  resetChecklistColumn,
  getCandidateActivityLogs,
  saveStageNote,

  /**
   * Unassign candidate from their current demand.
   * Keeps both sides in sync: updates demand's assignedCandidates/filledPositions
   * and clears candidate's demandId.
   */
  unassignFromDemand: asyncHandler(async (req, res) => {
    const { id: candidateId } = req.params;
    const agencyId = req.user.agencyId;

    const candidate = await Candidate.findOne({ _id: candidateId, agencyId });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const demandId = candidate.demandId;
    if (!demandId) {
      return res
        .status(400)
        .json({ message: "Candidate is not assigned to any demand" });
    }

    // Update demand: pull candidate and decrement filledPositions
    const demand = await JobDemand.findOneAndUpdate(
      { _id: demandId, agencyId, assignedCandidates: candidateId },
      {
        $pull: { assignedCandidates: candidateId },
        $inc: { filledPositions: -1 },
      },
      { new: true },
    );

    if (!demand) {
      return res
        .status(404)
        .json({ message: "Demand not found or candidate not assigned" });
    }

    // Revert demand status if it was filled
    if (
      demand.status === "filled" &&
      demand.filledPositions < demand.totalPositions
    ) {
      await JobDemand.findByIdAndUpdate(demand._id, { status: "active" });
    }

    // Clear candidate side
    await Candidate.findByIdAndUpdate(candidateId, {
      $unset: { demandId: 1, assignedDemand: 1 },
    });

    // Recompute candidate status
    await computeAndSaveCandidateStatus(candidateId);

    const updatedCandidate = await Candidate.findById(candidateId)
      .populate("agentId", "name")
      .lean();

    res.status(200).json({
      message: "Candidate unassigned from demand",
      candidate: updatedCandidate,
    });
  }),

  bulkUpdateStatus: asyncHandler(async (req, res) => {
    const { candidateIds, status } = req.body;
    if (!Array.isArray(candidateIds) || !candidateIds.length || !status) {
      return res
        .status(400)
        .json({ message: "candidateIds array and status are required" });
    }

    const agencyId = req.user.agencyId;
    const records = await Candidate.find({
      _id: { $in: candidateIds },
      agencyId,
    })
      .select("_id")
      .lean();
    if (!records.length)
      return res.status(404).json({ message: "No candidates found" });

    await Candidate.updateMany(
      { _id: { $in: records.map((c) => c._id) } },
      { $set: { status } },
    );
    await Promise.allSettled(
      records.map((c) => computeAndSaveCandidateStatus(c._id)),
    );
    invalidateAlertCache(agencyId);

    res.status(200).json({ updated: records.length });
  }),

  getPrintBundle: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const agencyId = req.user.agencyId;

    const candidate = await Candidate.findOne({ _id: id, agencyId })
      .populate("agentId", "name")
      .lean();
    if (!candidate)
      return res.status(404).json({ message: "Candidate not found" });

    const [medical, orientation, insurance, demand, passport] =
      await Promise.all([
        Medical.findOne({ candidateId: id }).sort({ createdAt: -1 }).lean(),
        Orientation.findOne({ candidateId: id }).sort({ createdAt: -1 }).lean(),
        InsuranceSsf.findOne({ candidateId: id })
          .sort({ createdAt: -1 })
          .lean(),
        candidate.demandId
          ? JobDemand.findById(candidate.demandId).lean()
          : null,
        candidate.passportId
          ? Passport.findById(candidate.passportId).lean()
          : candidate.passportNumber
            ? Passport.findOne({
                passportNumber: candidate.passportNumber,
                agencyId,
              }).lean()
            : null,
      ]);

    res
      .status(200)
      .json({ candidate, medical, orientation, insurance, demand, passport });
  }),

  /**
   * Bulk hydrate candidates for client-side export.
   * Accepts up to 2000 ids; returns full records joined with passport,
   * demand, latest medical / orientation / insurance docs.
   * Tenant-scoped; ignores ids that don't belong to the user's agency.
   */
  exportBatch: asyncHandler(async (req, res) => {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ message: "ids array is required" });
    }
    if (ids.length > 2000) {
      return res
        .status(400)
        .json({ message: "Maximum 2000 candidates per export" });
    }

    const agencyId = req.user.agencyId;

    const candidates = await Candidate.find({ _id: { $in: ids }, agencyId })
      .populate("agentId", "name")
      .populate("demandId")
      .populate("passportId")
      .lean();

    if (!candidates.length) {
      return res.status(200).json({ rows: [] });
    }

    const candidateIds = candidates.map((c) => c._id);

    // Fetch latest related docs for all candidates in parallel
    const [allMedicals, allOrientations, allInsurances] = await Promise.all([
      Medical.find({ candidateId: { $in: candidateIds } })
        .sort({ createdAt: -1 })
        .lean(),
      Orientation.find({ candidateId: { $in: candidateIds } })
        .sort({ createdAt: -1 })
        .lean(),
      InsuranceSsf.find({ candidateId: { $in: candidateIds } })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Index latest record per candidate
    const indexLatest = (docs) => {
      const map = new Map();
      for (const d of docs) {
        const key = String(d.candidateId);
        if (!map.has(key)) map.set(key, d); // first wins due to sort desc
      }
      return map;
    };
    const medByCand = indexLatest(allMedicals);
    const oriByCand = indexLatest(allOrientations);
    const insByCand = indexLatest(allInsurances);

    const rows = candidates.map((c) => {
      const key = String(c._id);
      return {
        candidate: c,
        passport: c.passportId || null,
        demand: c.demandId || null,
        medical: medByCand.get(key) || null,
        orientation: oriByCand.get(key) || null,
        insurance: insByCand.get(key) || null,
      };
    });

    res.status(200).json({ rows });
  }),

  updateProfileSection: asyncHandler(async (req, res) => {
    const allowed = [
      "bankInfo",
      "training",
      "academic",
      "nomineeInfo",
      "permanentProvince",
      "permanentDistrict",
      "permanentMunicipality",
      "permanentWardNo",
      "temporaryAddress",
      "temporaryMunicipality",
      "temporaryDistrict",
      "temporaryProvince",
      "visaNumber",
      "visaIssuedDate",
      "visaReceivedDate",
      "visaExpiryDate",
      "kdnBpaNo",
      "branchInfo",
      "maritalStatus",
      "religion",
    ];

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k)),
    );

    const candidate = await Candidate.findOneAndUpdate(
      scopeFilter(req, { _id: req.params.id }),
      { $set: updates },
      { new: true, runValidators: false },
    );

    if (!candidate)
      return res.status(404).json({ message: "Candidate not found" });
    res.status(200).json({ success: true, candidate });
  }),
};
