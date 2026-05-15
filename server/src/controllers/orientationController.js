import Orientation from '../models/Orientation.js';
import Candidate from '../models/Candidate.js';
import uploadMiddleware from '../middleware/upload.js';
import asyncHandler from '../utils/asyncHandler.js';
import { computeAndSaveCandidateStatus } from '../services/candidateStatusService.js';
import { scopeFilter, scopeData } from '../utils/tenantHelper.js';
import { logActivity } from '../utils/activityLogger.js';
const { deleteCloudinaryFile, isCloudinaryConfigured } = uploadMiddleware;

const createOrientation = asyncHandler(async (req, res) => {
  const { candidateId, trainingCenter, trainingCenterCode, batchNumber, startDate, notes } = req.body;

  if (!candidateId || !startDate) {
    return res.status(400).json({ message: 'Candidate ID and start date are required' });
  }

  const candidate = await Candidate.findOne(scopeFilter(req, { _id: candidateId }));
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  const existingOrientation = await Orientation.findOne(scopeFilter(req, {
    candidateId,
    completionStatus: { $in: ['scheduled', 'completed'] }
  }));

  if (existingOrientation) {
    return res.status(400).json({ message: 'An active orientation record already exists for this candidate' });
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 2);

  const orientation = await Orientation.create(scopeData(req, {
    candidateId,
    trainingCenter,
    trainingCenterCode,
    batchNumber,
    startDate,
    endDate,
    notes
  }));

  await logActivity({
    candidateId: orientation.candidateId,
    agencyId: req.user.agencyId,
    userId: req.user.userId,
    userName: req.user.name,
    columnId: 'orientation',
    action: 'created',
    details: `PDOT scheduled for ${startDate} at ${trainingCenter || 'N/A'}`,
    referenceId: orientation._id,
    referenceModel: 'Orientation'
  });

  // Recompute status
  await computeAndSaveCandidateStatus(candidateId);

  const populated = await Orientation.findById(orientation._id)
    .populate('candidateId', 'fullName desiredCountry status');

  res.status(201).json(populated);
});

const updateOrientation = asyncHandler(async (req, res) => {
  const { completionStatus, certificateNumber, certificateIssuedDate, feePaidAt, feeReceiptNumber, trainingCenter, trainingCenterCode, batchNumber, startDate, notes } = req.body;

  const orientation = await Orientation.findOne(scopeFilter(req, { _id: req.params.id }));
  if (!orientation) {
    return res.status(404).json({ message: 'Orientation record not found' });
  }

  const updates = {};
  if (completionStatus !== undefined) updates.completionStatus = completionStatus;
  if (trainingCenter !== undefined) updates.trainingCenter = trainingCenter;
  if (trainingCenterCode !== undefined) updates.trainingCenterCode = trainingCenterCode;
  if (batchNumber !== undefined) updates.batchNumber = batchNumber;
  if (startDate !== undefined) {
    updates.startDate = startDate;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2);
    updates.endDate = endDate;
  }
  if (notes !== undefined) updates.notes = notes;
  if (certificateNumber !== undefined) updates.certificateNumber = certificateNumber;
  if (certificateIssuedDate !== undefined) updates.certificateIssuedDate = certificateIssuedDate;
  if (feePaidAt !== undefined) updates.feePaidAt = feePaidAt;
  if (feeReceiptNumber !== undefined) updates.feeReceiptNumber = feeReceiptNumber;

  if (req.file) {
    if (orientation.certificateFilePublicId && isCloudinaryConfigured()) {
      await deleteCloudinaryFile(orientation.certificateFilePublicId);
    }
    
    let fileUrl, publicId;
    if (isCloudinaryConfigured() && req.file.path) {
      fileUrl = req.file.path;
      publicId = req.file.filename;
    } else {
      fileUrl = `/uploads/orientation/${req.file.filename}`;
      publicId = null;
    }
    
    updates.certificateFileUrl = fileUrl;
    updates.certificateFilePublicId = publicId;
    updates.certificateUploadedAt = new Date();
  }

  if (completionStatus === 'completed' && !certificateNumber && !orientation.certificateNumber) {
    return res.status(400).json({ message: 'Certificate number is required to mark as completed' });
  }

  const updated = await Orientation.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('candidateId', 'fullName desiredCountry status');

  // Log activity
  const activityDetails = [];
  if (updates.completionStatus) activityDetails.push(`Status: ${updates.completionStatus}`);
  if (updates.certificateNumber) activityDetails.push(`Certificate#: ${updates.certificateNumber}`);
  if (req.file) activityDetails.push('Certificate uploaded');

  if (activityDetails.length > 0) {
    await logActivity({
      candidateId: updated.candidateId,
      agencyId: req.user.agencyId,
      userId: req.user.userId,
      userName: req.user.name,
      columnId: 'orientation',
      action: updates.completionStatus === 'completed' ? 'status_changed' : 'updated',
      details: activityDetails.join(', '),
      previousValue: orientation.completionStatus,
      newValue: updates.completionStatus,
      fileUrl: updates.certificateFileUrl,
      referenceId: updated._id,
      referenceModel: 'Orientation'
    });
  }

  // Recompute central status logic
  await computeAndSaveCandidateStatus(orientation.candidateId);

  res.status(200).json(updated);
});

const getOrientationsByCandidate = asyncHandler(async (req, res) => {
  const { candidateId } = req.query;

  if (!candidateId) {
    return res.status(400).json({ message: 'Candidate ID is required' });
  }

  const orientations = await Orientation.find(scopeFilter(req, { candidateId }))
    .sort({ createdAt: -1 })
    .populate('candidateId', 'fullName desiredCountry status')
    .lean();

  res.status(200).json(orientations);
});

const getUpcomingOrientations = asyncHandler(async (req, res) => {
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const upcoming = await Orientation.find(scopeFilter(req, {
    completionStatus: 'scheduled',
    startDate: { $lte: threeDaysFromNow, $gte: now },
    notificationSent: false
  })).populate('candidateId', 'fullName phone').lean();

  await Orientation.updateMany(
    { _id: { $in: upcoming.map(o => o._id) } },
    { notificationSent: true }
  );

  res.status(200).json(upcoming);
});

const getMissingCertificates = asyncHandler(async (req, res) => {
  const missing = await Orientation.find(scopeFilter(req, {
    completionStatus: 'completed',
    certificateNumber: { $exists: false }
  })).populate('candidateId', 'fullName desiredCountry').lean();

  res.status(200).json(missing);
});

const deleteOrientation = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Only admin can delete orientation records' });
  }

  const orientation = await Orientation.findOne(scopeFilter(req, { _id: req.params.id }));

  if (!orientation) {
    return res.status(404).json({ message: 'Orientation record not found' });
  }

  const candidateId = orientation.candidateId;

  if (orientation.certificateFilePublicId) {
    await deleteCloudinaryFile(orientation.certificateFilePublicId);
  }
  if (orientation.attendanceSheetPublicId) {
    await deleteCloudinaryFile(orientation.attendanceSheetPublicId);
  }

  await Orientation.findByIdAndDelete(req.params.id);

  // Recompute status
  await computeAndSaveCandidateStatus(candidateId);

  res.status(200).json({ message: 'Orientation record deleted successfully' });
});

const uploadCertificate = asyncHandler(async (req, res) => {
  const orientation = await Orientation.findOne(scopeFilter(req, {
    _id: req.params.id
  }));

  if (!orientation) {
    return res.status(404).json({ message: 'Orientation record not found' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  if (orientation.certificateFilePublicId && isCloudinaryConfigured()) {
    await deleteCloudinaryFile(orientation.certificateFilePublicId);
  }

  let fileUrl, publicId;
  if (isCloudinaryConfigured() && req.file.path) {
    fileUrl = req.file.path;
    publicId = req.file.filename;
  } else {
    fileUrl = `/uploads/orientation/${req.file.filename}`;
    publicId = null;
  }

  orientation.certificateFileUrl = fileUrl;
  orientation.certificateFilePublicId = publicId;
  orientation.certificateUploadedAt = new Date();
  orientation.certificateUploadedBy = req.user.userId;

  await orientation.save();

  res.status(200).json(orientation);
});

const deleteCertificate = asyncHandler(async (req, res) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin or manager role required' });
  }

  const orientation = await Orientation.findOne(scopeFilter(req, {
    _id: req.params.id
  }));

  if (!orientation) {
    return res.status(404).json({ message: 'Orientation record not found' });
  }

  if (orientation.certificateFilePublicId) {
    await deleteCloudinaryFile(orientation.certificateFilePublicId);
  }

  orientation.certificateFileUrl = null;
  orientation.certificateFilePublicId = null;
  orientation.certificateUploadedAt = null;
  orientation.certificateUploadedBy = null;

  await orientation.save();

  res.status(200).json(orientation);
});

const uploadAttendanceSheet = asyncHandler(async (req, res) => {
  const orientation = await Orientation.findOne(scopeFilter(req, {
    _id: req.params.id
  }));

  if (!orientation) {
    return res.status(404).json({ message: 'Orientation record not found' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  if (orientation.attendanceSheetPublicId && isCloudinaryConfigured()) {
    await deleteCloudinaryFile(orientation.attendanceSheetPublicId);
  }

  let fileUrl, publicId;
  if (isCloudinaryConfigured() && req.file.path) {
    fileUrl = req.file.path;
    publicId = req.file.filename;
  } else {
    fileUrl = `/uploads/orientation/${req.file.filename}`;
    publicId = null;
  }

  orientation.attendanceSheetUrl = fileUrl;
  orientation.attendanceSheetPublicId = publicId;

  await orientation.save();

  res.status(200).json(orientation);
});

const deleteAttendanceSheet = asyncHandler(async (req, res) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin or manager role required' });
  }

  const orientation = await Orientation.findOne(scopeFilter(req, {
    _id: req.params.id
  }));

  if (!orientation) {
    return res.status(404).json({ message: 'Orientation record not found' });
  }

  if (orientation.attendanceSheetPublicId) {
    await deleteCloudinaryFile(orientation.attendanceSheetPublicId);
  }

  orientation.attendanceSheetUrl = null;
  orientation.attendanceSheetPublicId = null;

  await orientation.save();

  res.status(200).json(orientation);
});

const ORIENTATION_BOARD_STATUSES = ['orientation_scheduled', 'orientation_completed', 'orientation_absent'];

const getOrientationBoard = asyncHandler(async (req, res) => {
  const candidates = await Candidate.find({
    agencyId: req.user.agencyId,
    status: { $in: ORIENTATION_BOARD_STATUSES }
  }).select('_id fullName status desiredCountry').lean();

  const candidateIds = candidates.map(c => c._id);
  const candidateMap = Object.fromEntries(candidates.map(c => [c._id.toString(), c]));

  const orientations = candidateIds.length
    ? await Orientation.find({ candidateId: { $in: candidateIds }, agencyId: req.user.agencyId })
        .sort({ startDate: 1 }).lean()
    : [];

  const enriched = orientations.map(o => ({ ...o, candidate: candidateMap[o.candidateId.toString()] || null }));

  const upcoming    = enriched.filter(o => o.completionStatus === 'scheduled');
  const completed   = enriched.filter(o => o.completionStatus === 'completed');
  const absent      = enriched.filter(o => o.completionStatus === 'absent');
  const missingCert = completed.filter(o => !o.certificateFileUrl);

  // Group upcoming by batchNumber for batch-level bulk actions
  const batchMap = {};
  for (const o of upcoming) {
    const key = o.batchNumber || '_ungrouped';
    if (!batchMap[key]) batchMap[key] = [];
    batchMap[key].push(o);
  }
  const batchGroups = Object.entries(batchMap).map(([key, items]) => ({
    batchNumber:    key === '_ungrouped' ? null : key,
    trainingCenter: items[0]?.trainingCenter || null,
    startDate:      items[0]?.startDate || null,
    endDate:        items[0]?.endDate || null,
    orientations:   items
  }));

  res.status(200).json({ data: { upcoming, completed, absent, missingCert, batchGroups, total: orientations.length } });
});

const bulkUpdateOrientationStatus = asyncHandler(async (req, res) => {
  const { orientationIds, completionStatus } = req.body;
  if (!Array.isArray(orientationIds) || !orientationIds.length || !completionStatus) {
    return res.status(400).json({ message: 'orientationIds array and completionStatus are required' });
  }
  if (!['scheduled', 'completed', 'absent', 'failed'].includes(completionStatus)) {
    return res.status(400).json({ message: 'Invalid completionStatus' });
  }

  const records = await Orientation.find({ _id: { $in: orientationIds }, agencyId: req.user.agencyId })
    .select('_id candidateId').lean();
  if (!records.length) return res.status(404).json({ message: 'No orientation records found' });

  await Orientation.updateMany({ _id: { $in: records.map(o => o._id) } }, { $set: { completionStatus } });

  const uniqueCandidateIds = [...new Set(records.map(o => o.candidateId.toString()))];
  await Promise.allSettled(uniqueCandidateIds.map(id => computeAndSaveCandidateStatus(id)));

  res.status(200).json({ updated: records.length });
});

export default {
  createOrientation,
  updateOrientation,
  getOrientationsByCandidate,
  getUpcomingOrientations,
  getMissingCertificates,
  deleteOrientation,
  uploadCertificate,
  deleteCertificate,
  uploadAttendanceSheet,
  deleteAttendanceSheet,
  getOrientationBoard,
  bulkUpdateOrientationStatus
};