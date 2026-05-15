import TradeTest from '../models/TradeTest.js';
import Candidate from '../models/Candidate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { computeAndSaveCandidateStatus } from '../services/candidateStatusService.js';
import { scopeFilter, scopeData } from '../utils/tenantHelper.js';
import { logActivity } from '../utils/activityLogger.js';
import { invalidateAlertCache } from '../cache/alertCache.js';

const getTradeTests = asyncHandler(async (req, res) => {
  const { result, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = scopeFilter(req);
  if (result) filter.result = result;

  const [tradeTests, total] = await Promise.all([
    TradeTest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('candidateId', 'fullName status desiredCountry')
      .lean(),
    TradeTest.countDocuments(filter)
  ]);

  res.status(200).json({ data: tradeTests, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

const getTradeTestById = asyncHandler(async (req, res) => {
  const record = await TradeTest.findOne(scopeFilter(req, { _id: req.params.id }))
    .populate('candidateId', 'fullName status desiredCountry');

  if (!record) return res.status(404).json({ message: 'Trade test record not found' });
  res.status(200).json(record);
});

const getTradeTestByCandidate = asyncHandler(async (req, res) => {
  const { candidateId } = req.query;
  if (!candidateId) return res.status(400).json({ message: 'Candidate ID is required' });

  const records = await TradeTest.find(scopeFilter(req, { candidateId }))
    .sort({ createdAt: -1 })
    .populate('candidateId', 'fullName status desiredCountry')
    .lean();

  res.status(200).json(records);
});

const createTradeTest = asyncHandler(async (req, res) => {
  const { candidateId } = req.body;
  if (!candidateId) return res.status(400).json({ message: 'Candidate ID is required' });

  const candidate = await Candidate.findOne(scopeFilter(req, { _id: candidateId }));
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

  const data = scopeData(req, { ...req.body });
  if (req.file) data.certificateFileUrl = req.file.path;

  const record = await TradeTest.create(data);

  await logActivity({
    candidateId: record.candidateId,
    agencyId: req.user.agencyId,
    userId: req.user.userId,
    userName: req.user.name,
    columnId: 'trade_test',
    action: 'created',
    details: `Trade test scheduled at ${record.testCenter || 'N/A'} for ${record.tradeCategory || 'N/A'}`,
    referenceId: record._id,
    referenceModel: 'TradeTest'
  });

  await computeAndSaveCandidateStatus(candidateId);
  invalidateAlertCache(req.user.agencyId);

  const populated = await TradeTest.findById(record._id).populate('candidateId', 'fullName status desiredCountry');
  res.status(201).json(populated);
});

const updateTradeTest = asyncHandler(async (req, res) => {
  const record = await TradeTest.findOne(scopeFilter(req, { _id: req.params.id }));
  if (!record) return res.status(404).json({ message: 'Trade test record not found' });

  const updates = { ...req.body };
  delete updates.candidateId;
  delete updates.agencyId;

  if (req.file) updates.certificateFileUrl = req.file.path;

  // Auto-set expiry when result = pass
  if (updates.result === 'pass' && updates.conductedDate && !updates.expiryDate) {
    const expiry = new Date(updates.conductedDate);
    expiry.setMonth(expiry.getMonth() + (record.validityMonths || 24));
    updates.expiryDate = expiry;
  }

  const updated = await TradeTest.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('candidateId', 'fullName status desiredCountry');

  const activityDetails = [];
  if (updates.result) activityDetails.push(`Result: ${updates.result}`);
  if (updates.certificateNumber) activityDetails.push(`Cert#: ${updates.certificateNumber}`);
  if (req.file) activityDetails.push('File uploaded');

  if (activityDetails.length > 0) {
    await logActivity({
      candidateId: record.candidateId,
      agencyId: req.user.agencyId,
      userId: req.user.userId,
      userName: req.user.name,
      columnId: 'trade_test',
      action: updates.result ? 'status_changed' : 'updated',
      details: activityDetails.join(', '),
      previousValue: record.result,
      newValue: updates.result,
      referenceId: record._id,
      referenceModel: 'TradeTest'
    });
  }

  await computeAndSaveCandidateStatus(record.candidateId);
  invalidateAlertCache(req.user.agencyId);

  res.status(200).json(updated);
});

const deleteTradeTest = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Only admin can delete trade test records' });
  }

  const record = await TradeTest.findOne(scopeFilter(req, { _id: req.params.id }));
  if (!record) return res.status(404).json({ message: 'Trade test record not found' });

  const candidateId = record.candidateId;
  await TradeTest.findByIdAndDelete(req.params.id);
  await computeAndSaveCandidateStatus(candidateId);

  res.status(200).json({ message: 'Trade test record deleted successfully' });
});

export default { getTradeTests, getTradeTestById, getTradeTestByCandidate, createTradeTest, updateTradeTest, deleteTradeTest };
