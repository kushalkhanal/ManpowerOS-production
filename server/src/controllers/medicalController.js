import Medical from '../models/Medical.js';
import Candidate from '../models/Candidate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { computeAndSaveCandidateStatus } from '../services/candidateStatusService.js';
import { scopeFilter, scopeData } from '../utils/tenantHelper.js';
import { logActivity } from '../utils/activityLogger.js';
import { invalidateAlertCache } from '../cache/alertCache.js';
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

const DEFAULT_MEDICAL_TYPES = {
  'Qatar': 'gamca',
  'Saudi Arabia': 'gamca',
  'Oman': 'gamca',
  'Kuwait': 'gamca',
  'Bahrain': 'gamca',
  'UAE': 'wafid'
};

const getMedicals = asyncHandler(async (req, res) => {
  const { status, result, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = scopeFilter(req);
  if (result) filter.result = result;

  const [medicals, total] = await Promise.all([
    Medical.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('candidateId', 'fullName status')
      .lean(),
    Medical.countDocuments(filter)
  ]);

  res.status(200).json({
    data: medicals,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
});

const getMedicalById = asyncHandler(async (req, res) => {
  const medical = await Medical.findOne(scopeFilter(req, { _id: req.params.id }))
    .populate('candidateId', 'fullName status');

  if (!medical) {
    return res.status(404).json({ message: 'Medical record not found' });
  }

  res.status(200).json(medical);
});

const createMedical = asyncHandler(async (req, res) => {
  const { candidateId, medicalType, medicalCenter, medicalCenterLocation, scheduledDate, notes, reportNumber, conductedDate, reportExpiryDate, result, referringAgency, examinedBy } = req.body;

  if (!candidateId) {
    return res.status(400).json({ message: 'Candidate ID is required' });
  }

  const candidate = await Candidate.findOne(scopeFilter(req, { _id: candidateId }));
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  let defaultMedicalType = medicalType || 'other';
  if (candidate.desiredCountry && DEFAULT_MEDICAL_TYPES[candidate.desiredCountry]) {
    defaultMedicalType = DEFAULT_MEDICAL_TYPES[candidate.desiredCountry];
  }

  const medicalData = scopeData(req, {
    candidateId,
    medicalType: medicalType || defaultMedicalType,
    medicalCenter,
    medicalCenterLocation,
    scheduledDate,
    notes,
    reportNumber,
    conductedDate,
    reportExpiryDate,
    result,
    referringAgency,
    examinedBy
  });

  if (req.file) {
    medicalData.reportFileUrl = req.file.path;
  }

  const medical = await Medical.create(medicalData);

  await logActivity({
    candidateId: medical.candidateId,
    agencyId: req.user.agencyId,
    userId: req.user.userId,
    userName: req.user.name,
    columnId: 'medical',
    action: 'created',
    details: `Medical examination scheduled at ${medicalCenter || 'N/A'}`,
    referenceId: medical._id,
    referenceModel: 'Medical'
  });

  // Recompute status for the candidate
  await computeAndSaveCandidateStatus(candidateId);

  const populated = await Medical.findById(medical._id).populate('candidateId', 'fullName desiredCountry status');

  res.status(201).json(populated);
});

const updateMedical = asyncHandler(async (req, res) => {
  const { result, conductedDate, reportNumber, reportExpiryDate, reportFileUrl, notes, unfitReason, recheckScheduledDate, medicalCenter, referringAgency, examinedBy } = req.body;

  const medical = await Medical.findOne(scopeFilter(req, { _id: req.params.id }));
  if (!medical) {
    return res.status(404).json({ message: 'Medical record not found' });
  }

  const updates = {};
  if (result !== undefined) updates.result = result;
  if (conductedDate !== undefined) updates.conductedDate = conductedDate;
  if (reportNumber !== undefined) updates.reportNumber = reportNumber;
  if (reportExpiryDate !== undefined) updates.reportExpiryDate = reportExpiryDate;
  if (reportFileUrl !== undefined) updates.reportFileUrl = reportFileUrl;
  if (notes !== undefined) updates.notes = notes;
  if (unfitReason !== undefined) updates.unfitReason = unfitReason;
  if (recheckScheduledDate !== undefined) updates.recheckScheduledDate = recheckScheduledDate;
  if (medicalCenter !== undefined) updates.medicalCenter = medicalCenter;
  if (referringAgency !== undefined) updates.referringAgency = referringAgency;
  if (examinedBy !== undefined) updates.examinedBy = examinedBy;

  const orphanedFileUrls = [];
  if (req.file) {
    if (medical.reportFileUrl) orphanedFileUrls.push(medical.reportFileUrl);
    updates.reportFileUrl = req.file.path;
  }

  if (result === 'fit') {
    updates.fitClearedAt = new Date();
  }

  if (!reportExpiryDate && updates.conductedDate) {
    const expiryDate = new Date(updates.conductedDate);
    expiryDate.setMonth(expiryDate.getMonth() + 3);
    updates.reportExpiryDate = expiryDate;
  }

  const updated = await Medical.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('candidateId', 'fullName desiredCountry status');

  // Log activity for updates
  const activityDetails = [];
  if (updates.result) activityDetails.push(`Result: ${updates.result}`);
  if (updates.conductedDate) activityDetails.push(`Conducted: ${updates.conductedDate}`);
  if (updates.reportNumber) activityDetails.push(`Report#: ${updates.reportNumber}`);
  if (req.file) activityDetails.push('File uploaded');

  if (activityDetails.length > 0) {
    await logActivity({
      candidateId: updated.candidateId,
      agencyId: req.user.agencyId,
      userId: req.user.userId,
      userName: req.user.name,
      columnId: 'medical',
      action: updates.result === 'fit' || updates.result === 'unfit' ? 'status_changed' : 'updated',
      details: activityDetails.join(', '),
      previousValue: medical.result,
      newValue: updates.result,
      fileUrl: updates.reportFileUrl,
      referenceId: updated._id,
      referenceModel: 'Medical'
    });
  }

  await computeAndSaveCandidateStatus(medical.candidateId);
  invalidateAlertCache(req.user.agencyId);

  cleanupCloudinaryAssets(orphanedFileUrls);

  res.status(200).json(updated);
});

const getMedicalByCandidate = asyncHandler(async (req, res) => {
  const { candidateId } = req.query;

  if (!candidateId) {
    return res.status(400).json({ message: 'Candidate ID is required' });
  }

  const medicals = await Medical.find(scopeFilter(req, { candidateId }))
    .sort({ createdAt: -1 })
    .populate('candidateId', 'fullName desiredCountry status')
    .lean();

  res.status(200).json(medicals);
});

const getExpiringMedicals = asyncHandler(async (req, res) => {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringMedicals = await Medical.find(scopeFilter(req, {
    reportExpiryDate: { $lte: thirtyDaysFromNow },
    result: 'fit'
  })).populate({
    path: 'candidateId',
    match: { status: { $ne: 'departed' } },
    select: 'fullName desiredCountry status'
  }).lean();

  const filtered = expiringMedicals.filter(m => m.candidateId);

  const enriched = filtered.map(m => {
    const daysUntilExpiry = Math.ceil((new Date(m.reportExpiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return { ...m, daysUntilExpiry };
  });

  res.status(200).json(enriched);
});

const getUpcomingRechecks = asyncHandler(async (req, res) => {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const rechecks = await Medical.find(scopeFilter(req, {
    result: 'unfit',
    recheckScheduledDate: { $lte: sevenDaysFromNow, $gte: now },
    recheckNotificationSent: false
  })).populate('candidateId', 'fullName phone').lean();

  await Medical.updateMany(
    { _id: { $in: rechecks.map(r => r._id) } },
    { recheckNotificationSent: true }
  );

  res.status(200).json(rechecks);
});

const deleteMedical = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Only admin can delete medical records' });
  }

  const medical = await Medical.findOne(scopeFilter(req, { _id: req.params.id }));

  if (!medical) {
    return res.status(404).json({ message: 'Medical record not found' });
  }

  const candidateId = medical.candidateId;
  const fileUrlsToClean = [medical.reportFileUrl].filter(Boolean);
  await Medical.findByIdAndDelete(req.params.id);

  // Recompute central status logic
  await computeAndSaveCandidateStatus(candidateId);

  cleanupCloudinaryAssets(fileUrlsToClean);

  res.status(200).json({ message: 'Medical record deleted successfully' });
});

const MEDICAL_BOARD_STATUSES = [
  'medical_scheduled', 'medical_passed', 'medical_failed', 'medical_on_hold', 'medical_expired'
];

const getMedicalBoard = asyncHandler(async (req, res) => {
  const today = new Date();
  const thirtyDaysOut = new Date(today.getTime() + 30 * 86400000);

  const candidates = await Candidate.find({
    agencyId: req.user.agencyId,
    status: { $in: MEDICAL_BOARD_STATUSES }
  }).select('_id fullName status desiredCountry passportNumber').lean();

  const candidateIds = candidates.map(c => c._id);
  const candidateMap = Object.fromEntries(candidates.map(c => [c._id.toString(), c]));

  const medicals = candidateIds.length
    ? await Medical.find({ candidateId: { $in: candidateIds }, agencyId: req.user.agencyId })
        .sort({ scheduledDate: -1, createdAt: -1 }).lean()
    : [];

  // Latest record per candidate
  const seen = new Set();
  const latest = [];
  for (const m of medicals) {
    const key = m.candidateId.toString();
    if (!seen.has(key)) { seen.add(key); latest.push({ ...m, candidate: candidateMap[key] || null }); }
  }

  const scheduled = latest.filter(m => m.result === 'pending');
  const fit       = latest.filter(m => m.result === 'fit');
  const unfit     = latest.filter(m => m.result === 'unfit');
  const onHold    = latest.filter(m => m.result === 'on_hold');
  const expiring  = latest.filter(m =>
    m.result === 'fit' && m.reportExpiryDate &&
    new Date(m.reportExpiryDate) > today &&
    new Date(m.reportExpiryDate) <= thirtyDaysOut
  );

  res.status(200).json({ data: { scheduled, fit, unfit, onHold, expiring, total: latest.length } });
});

const bulkUpdateMedicalResult = asyncHandler(async (req, res) => {
  const { medicalIds, result } = req.body;
  if (!Array.isArray(medicalIds) || !medicalIds.length || !result) {
    return res.status(400).json({ message: 'medicalIds array and result are required' });
  }
  if (!['pending', 'fit', 'unfit', 'on_hold'].includes(result)) {
    return res.status(400).json({ message: 'Invalid result value' });
  }

  const records = await Medical.find({ _id: { $in: medicalIds }, agencyId: req.user.agencyId })
    .select('_id candidateId').lean();
  if (!records.length) return res.status(404).json({ message: 'No medical records found' });

  const updates = { result };
  if (result === 'fit') updates.fitClearedAt = new Date();

  await Medical.updateMany({ _id: { $in: records.map(m => m._id) } }, { $set: updates });

  const uniqueCandidateIds = [...new Set(records.map(m => m.candidateId.toString()))];
  await Promise.allSettled(uniqueCandidateIds.map(id => computeAndSaveCandidateStatus(id)));
  invalidateAlertCache(req.user.agencyId);

  res.status(200).json({ updated: records.length });
});

export default {
  createMedical,
  updateMedical,
  getMedicals,
  getMedicalById,
  getMedicalByCandidate,
  getExpiringMedicals,
  getUpcomingRechecks,
  deleteMedical,
  getMedicalBoard,
  bulkUpdateMedicalResult
};