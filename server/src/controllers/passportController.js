import Passport from '../models/Passport.js';
import PassportLog from '../models/PassportLog.js';
import Candidate from '../models/Candidate.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { extractPassportData } from '../services/passportOcrService.js';
import { adToBS } from '../utils/bsDate.js';
import path from 'path';
import fs from 'fs';
import { scopeFilter, scopeData } from '../utils/tenantHelper.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sanitizeFilename } from '../utils/fileSystemSanitize.js';
import { deleteCloudinaryFile, getPublicIdFromUrl } from '../middleware/upload.js';
import logger from '../config/logger.js';

const cleanupCloudinaryAssets = (urls) => {
  if (!urls || urls.length === 0) return;
  Promise.all(
    urls
      .filter(Boolean)
      .map(getPublicIdFromUrl)
      .filter(Boolean)
      .map((publicId) => deleteCloudinaryFile(publicId))
  ).catch((err) => logger.error('Cloudinary cleanup failed', err));
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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
    contactAddress
  } = req.body;

  const resolvedAgencyId = req.user.agencyId || req.body.agencyId;
  if (!resolvedAgencyId) {
    return res.status(400).json({
      message: 'Agency context is required. Superadmin must provide agencyId to create passport.'
    });
  }

  if (!passportNumber || !fullName) {
    return res.status(400).json({ message: 'passportNumber and fullName are required' });
  }

  if (candidateId) {
    const candidate = await Candidate.findOne(scopeFilter(req, { _id: candidateId }));
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
  }

  // Pre-creation check for duplicate (App-level)
  const existingPassport = await Passport.findOne(scopeFilter(req, {
    passportNumber
  }));
  if (existingPassport) {
    return res.status(400).json({ message: 'Passport number already exists within this agency' });
  }

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
    custodyStatus: 'with_agency',
    allocationStatus: candidateId ? 'allocated' : 'in_pool',
    candidateId: candidateId || undefined
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
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Passport number already exists within this agency' });
    }
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
        gender: passport.gender || 'male',
        nationalIdNumber: passport.passportNumber,
        phone: passport.contactPhone || '',
        passportId: passport._id,
        passportNumber: passport.passportNumber,
        status: 'registered',
        agentId: req.user.userId,
        registeredAt: new Date()
      });
      const stubCandidate = await Candidate.findOneAndUpdate(
        scopeFilter(req, { passportId: passport._id }),
        { $setOnInsert: setOnInsert },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      await Passport.findByIdAndUpdate(passport._id, {
        $set: { candidateId: stubCandidate._id }
      });
    } catch (err) {
      logger.error('Failed to auto-create stub candidate for passport', err);
      // Don't block passport creation — allocation can still create one later.
    }
  }

  // Log creation
  await PassportLog.create({
    passportId: passport._id,
    agencyId: resolvedAgencyId,
    performedBy: req.user.userId,
    action: candidateId ? 'collected_with_candidate' : 'collected',
    toStatus: candidateId ? 'allocated' : 'with_agency',
    notes: candidateId ? 'Passport collected and linked to existing candidate' : 'Passport added to pool'
  });

  const populated = await Passport.findById(passport._id)
    .populate('candidateId', 'fullName')
    .populate('collectedBy', 'name');

  res.status(201).json(populated);
});

const getPassports = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20, allocationStatus } = req.query;
  const pageNumber = parsePositiveInt(page, 1);
  const limitNumber = parsePositiveInt(limit, 20);
  const skip = (pageNumber - 1) * limitNumber;

  const filter = scopeFilter(req);

  if (status) {
    filter.custodyStatus = status;
  }

  if (allocationStatus) {
    filter.allocationStatus = allocationStatus;
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { passportNumber: searchRegex },
      { fullName: searchRegex }
    ];
  }

  const [passports, total] = await Promise.all([
    Passport.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .populate('candidateId', 'fullName phone email status nationalIdNumber permanentDistrict permanentMunicipality desiredCountry desiredJobCategory skills')
      .populate('collectedBy', 'name')
      .populate('allocatedToDemandId', 'employerCompanyName employerCountry jobCategory'),
    Passport.countDocuments(filter)
  ]);

  res.status(200).json({
    data: passports,
    total,
    page: pageNumber,
    pages: Math.ceil(total / limitNumber)
  });
});

const getPassportById = asyncHandler(async (req, res) => {
  // Use .lean() so populate returns RAW BSON for the candidate — Mongoose
  // hydration would otherwise strip fields like `physicalAttributes` and
  // `workHistory` when the on-disk subdoc shape doesn't perfectly match the
  // schema. Lean reads bypass that entirely.
  const passport = await Passport.findOne(scopeFilter(req, {
    _id: req.params.id
  }))
    .populate('candidateId', [
      'fullName', 'phone', 'email', 'status', 'nationalIdNumber',
      'gender', 'dateOfBirth', 'maritalStatus', 'religion',
      'permanentProvince', 'permanentDistrict', 'permanentMunicipality', 'permanentWardNo',
      'temporaryAddress', 'temporaryMunicipality', 'temporaryDistrict', 'temporaryProvince',
      'bankInfo', 'training', 'academic', 'nomineeInfo',
      'visaNumber', 'visaIssuedDate', 'visaReceivedDate', 'visaExpiryDate',
      'kdnBpaNo', 'branchInfo', 'desiredCountry', 'desiredJobCategory', 'skills',
      'physicalAttributes', 'workHistory',
      'workExperienceYears', 'languagesKnown', 'education',
    ].join(' '))
    .populate('collectedBy', 'name')
    .populate('returnedBy', 'name')
    .populate('allocatedToDemandId', 'employerCompanyName employerCountry jobCategory')
    .lean();

  if (!passport) {
    return res.status(404).json({ message: 'Passport not found' });
  }

  const logs = await PassportLog.find({ passportId: passport._id })
    .sort({ timestamp: -1 })
    .populate('performedBy', 'name')
    .lean();

  res.status(200).json({ passport, logs });
});

const updatePassportStatus = asyncHandler(async (req, res) => {
  const { custodyStatus, notes, location, sponsorName, sponsorNumber, assignedStaff } = req.body;

  if (!custodyStatus) {
    return res.status(400).json({ message: 'custodyStatus is required' });
  }

  const validTransitions = {
    'with_agency': ['returned_to_candidate', 'submitted_embassy', 'lost'],
    'returned_to_candidate': ['with_agency'],
    'submitted_embassy': ['with_agency', 'lost'],
    'lost': []
  };

  const passport = await Passport.findOne(scopeFilter(req, {
    _id: req.params.id
  }));

  if (!passport) {
    return res.status(404).json({ message: 'Passport not found' });
  }

  const currentStatus = passport.custodyStatus;

  if (!validTransitions[currentStatus]?.includes(custodyStatus)) {
    return res.status(400).json({
      message: `Invalid status transition from ${currentStatus} to ${custodyStatus}`
    });
  }

  const updateData = { custodyStatus };
  if (location) updateData.location = location;
  if (notes) updateData.notes = notes;
  if (sponsorName !== undefined) updateData.sponsorName = sponsorName;
  if (sponsorNumber !== undefined) updateData.sponsorNumber = sponsorNumber;
  if (assignedStaff !== undefined) updateData.assignedStaff = assignedStaff;

  if (custodyStatus === 'returned_to_candidate') {
    updateData.returnedBy = req.user.userId;
    updateData.returnedAt = new Date();
  }

  const updatedPassport = await Passport.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate('candidateId', 'fullName')
    .populate('collectedBy', 'name')
    .populate('returnedBy', 'name');

  await PassportLog.create({
    passportId: passport._id,
    agencyId: req.user.agencyId,
    performedBy: req.user.userId,
    action: 'status_changed',
    fromStatus: currentStatus,
    toStatus: custodyStatus,
    notes,
    sponsorName,
    sponsorNumber,
    assignedStaff
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
    gender
  } = req.body;

  const passport = await Passport.findOne(scopeFilter(req, {
    _id: req.params.id
  }));

  if (!passport) {
    return res.status(404).json({ message: 'Passport not found' });
  }

  if (passportNumber && passportNumber !== passport.passportNumber) {
    const existing = await Passport.findOne({
      agencyId: req.user.agencyId,
      passportNumber,
      _id: { $ne: passport._id }
    });
    if (existing) {
      return res.status(400).json({ message: 'Passport number already exists' });
    }
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
      { new: true, runValidators: true }
    )
      .populate('candidateId', 'fullName')
      .populate('collectedBy', 'name')
      .populate('returnedBy', 'name');
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Passport number already exists' });
    }
    throw err;
  }

  const changes = [];
  for (const key in updates) {
    if (key !== 'notes' && key !== 'location') {
      if (passport[key]?.toString() !== updates[key]?.toString()) {
        changes.push(`${key} modified`);
      }
    }
  }

  await PassportLog.create({
    passportId: passport._id,
    agencyId: req.user.agencyId,
    performedBy: req.user.userId,
    action: 'edited',
    notes: changes.length > 0 ? changes.join(', ') : notes || 'Details updated'
  });

  res.status(200).json(updatedPassport);
});

const deletePassport = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Only admin can delete passports' });
  }

  const passport = await Passport.findOne(scopeFilter(req, {
    _id: req.params.id
  }));

  if (!passport) {
    return res.status(404).json({ message: 'Passport not found' });
  }

  // Cascading cleanup
  const fileUrlsToClean = [passport.scannedImageUrl].filter(Boolean);
  await Promise.all([
    Passport.findByIdAndDelete(req.params.id),
    PassportLog.deleteMany({ passportId: req.params.id })
  ]);

  cleanupCloudinaryAssets(fileUrlsToClean);

  res.status(200).json({ message: 'Passport deleted successfully' });
});

const getPassportStats = asyncHandler(async (req, res) => {
  const stats = await Passport.aggregate([
    { $match: scopeFilter(req) },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        inPool: { $sum: { $cond: [{ $eq: ['$allocationStatus', 'in_pool'] }, 1, 0] } },
        allocated: { $sum: { $cond: [{ $eq: ['$allocationStatus', 'allocated'] }, 1, 0] } },
        withAgency: { $sum: { $cond: [{ $eq: ['$custodyStatus', 'with_agency'] }, 1, 0] } },
        returned: { $sum: { $cond: [{ $eq: ['$custodyStatus', 'returned_to_candidate'] }, 1, 0] } }
      }
    }
  ]);

  const result = stats[0] || {
    total: 0,
    inPool: 0,
    allocated: 0,
    withAgency: 0,
    returned: 0
  };

  delete result._id;
  res.status(200).json(result);
});

const getExpiringPassports = asyncHandler(async (req, res) => {
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

  const passports = await Passport.find(scopeFilter(req, {
    expiryDate: { $lte: sixtyDaysFromNow },
    custodyStatus: 'with_agency'
  }))
    .sort({ expiryDate: 1 })
    .populate('candidateId', 'fullName phone')
    .populate('collectedBy', 'name');

  res.status(200).json(passports);
});

const scanPassport = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  let imageBuffer;
  if (req.file.buffer) {
    imageBuffer = req.file.buffer;
  } else if (req.file.path && !req.file.path.startsWith('http')) {
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
  } else if (req.file.path && req.file.path.startsWith('http')) {
    scannedImageUrl = req.file.path;
  } else if (req.file.path) {
    const safeFilename = sanitizeFilename(path.basename(req.file.path));
    scannedImageUrl = `${process.env.API_BASE_URL || 'http://localhost:5000'}/uploads/passports/scans/${safeFilename}`;
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
      passportNumber: extractedData.passportNumber || '',
      guardianNumber: extractedData.guardianNumber || '',
      fullName: extractedData.fullName || '',
      surname: extractedData.surname || '',
      givenNames: extractedData.givenNames || '',
      dateOfBirth: isValidDate(extractedData.dateOfBirth) ? extractedData.dateOfBirth.toISOString() : null,
      dateOfBirthBS: formatDateDisplay(extractedData.dateOfBirth),
      gender: extractedData.gender || '',
      issueDate: isValidDate(extractedData.issueDate) ? extractedData.issueDate.toISOString() : null,
      issueDateBS: formatDateDisplay(extractedData.issueDate),
      expiryDate: isValidDate(extractedData.expiryDate) ? extractedData.expiryDate.toISOString() : null,
      expiryDateBS: formatDateDisplay(extractedData.expiryDate),
      issuedDistrict: extractedData.issuedDistrict || '',
      nationality: extractedData.nationality || 'NPL'
    },
    confidence: extractedData.confidence || {},
    warnings: extractedData.warnings || [],
    source: extractedData.source || 'unknown'
  });
});

// Idempotent — creates a stub Candidate linked to this passport if one does not
// already exist, then returns the fully populated passport. Used by the UI to
// enable profile-section editing for pool passports before demand allocation.
const ensureCandidate = asyncHandler(async (req, res) => {
  const passport = await Passport.findOne(scopeFilter(req, { _id: req.params.id }));
  if (!passport) return res.status(404).json({ message: 'Passport not found' });

  const CANDIDATE_POPULATE_FIELDS = [
    'fullName', 'phone', 'email', 'status', 'nationalIdNumber',
    'gender', 'dateOfBirth', 'maritalStatus', 'religion',
    'permanentProvince', 'permanentDistrict', 'permanentMunicipality', 'permanentWardNo',
    'temporaryAddress', 'temporaryMunicipality', 'temporaryDistrict', 'temporaryProvince',
    'bankInfo', 'training', 'academic', 'nomineeInfo',
    'visaNumber', 'visaIssuedDate', 'visaReceivedDate', 'visaExpiryDate',
    'kdnBpaNo', 'branchInfo', 'desiredCountry', 'desiredJobCategory', 'skills',
    'physicalAttributes', 'workHistory',
  ].join(' ');

  const setOnInsert = scopeData(req, {
    fullName: passport.fullName,
    dateOfBirth: passport.dateOfBirth,
    gender: passport.gender || 'male',
    nationalIdNumber: passport.passportNumber,
    phone: passport.contactPhone || '',
    passportId: passport._id,
    passportNumber: passport.passportNumber,
    status: 'registered',
    agentId: req.user.userId,
    registeredAt: new Date()
  });

  // Atomic upsert — concurrent requests for the same passportId will hit the
  // unique sparse index and return the existing candidate rather than creating a duplicate.
  const stub = await Candidate.findOneAndUpdate(
    scopeFilter(req, { passportId: passport._id }),
    { $setOnInsert: setOnInsert },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await Passport.findByIdAndUpdate(passport._id, { $set: { candidateId: stub._id } });

  const populated = await Passport.findById(passport._id)
    .populate('candidateId', CANDIDATE_POPULATE_FIELDS)
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
  getExpiringPassports,
  getPassportStats,
  scanPassport,
  ensureCandidate
};