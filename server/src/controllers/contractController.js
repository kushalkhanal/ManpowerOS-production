import WorkerContract from '../models/WorkerContract.js';
import Candidate from '../models/Candidate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { scopeFilter, scopeData } from '../utils/tenantHelper.js';
import { logActivity } from '../utils/activityLogger.js';
import { invalidateAlertCache } from '../cache/alertCache.js';

const getContracts = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = scopeFilter(req);
  if (status) filter.status = status;

  const [contracts, total] = await Promise.all([
    WorkerContract.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('candidateId', 'fullName status desiredCountry')
      .populate('demandId', 'jobTitle sponsorName')
      .lean(),
    WorkerContract.countDocuments(filter)
  ]);

  res.status(200).json({ data: contracts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

const getContractById = asyncHandler(async (req, res) => {
  const contract = await WorkerContract.findOne(scopeFilter(req, { _id: req.params.id }))
    .populate('candidateId', 'fullName status desiredCountry')
    .populate('demandId', 'jobTitle sponsorName');

  if (!contract) return res.status(404).json({ message: 'Contract not found' });
  res.status(200).json(contract);
});

const getContractByCandidate = asyncHandler(async (req, res) => {
  const { candidateId } = req.query;
  if (!candidateId) return res.status(400).json({ message: 'Candidate ID is required' });

  const contracts = await WorkerContract.find(scopeFilter(req, { candidateId }))
    .sort({ createdAt: -1 })
    .populate('candidateId', 'fullName status desiredCountry')
    .populate('demandId', 'jobTitle sponsorName')
    .lean();

  res.status(200).json(contracts);
});

const getExpiringContracts = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 60;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  const contracts = await WorkerContract.find(scopeFilter(req, {
    status: 'active',
    contractExpiryDate: { $lte: cutoff, $gte: new Date() }
  }))
    .populate('candidateId', 'fullName status desiredCountry phone')
    .lean();

  const enriched = contracts.map(c => ({
    ...c,
    daysUntilExpiry: Math.ceil((new Date(c.contractExpiryDate) - new Date()) / (1000 * 60 * 60 * 24))
  }));

  res.status(200).json(enriched);
});

const createContract = asyncHandler(async (req, res) => {
  const { candidateId } = req.body;
  if (!candidateId) return res.status(400).json({ message: 'Candidate ID is required' });

  const candidate = await Candidate.findOne(scopeFilter(req, { _id: candidateId }));
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

  const data = scopeData(req, { ...req.body });

  if (req.file) data.contractFileUrl = req.file.path;

  // Auto-calculate expiry from start date + duration
  if (data.contractStartDate && data.contractDurationMonths && !data.contractExpiryDate) {
    const expiry = new Date(data.contractStartDate);
    expiry.setMonth(expiry.getMonth() + parseInt(data.contractDurationMonths));
    data.contractExpiryDate = expiry;
  }

  const contract = await WorkerContract.create(data);

  await logActivity({
    candidateId: contract.candidateId,
    agencyId: req.user.agencyId,
    userId: req.user.userId,
    userName: req.user.name,
    columnId: 'contract',
    action: 'created',
    details: `Contract created — ${contract.contractDurationMonths || 'N/A'} months, ${contract.salary || 'N/A'} ${contract.salaryCurrency}`,
    referenceId: contract._id,
    referenceModel: 'WorkerContract'
  });

  invalidateAlertCache(req.user.agencyId);

  const populated = await WorkerContract.findById(contract._id)
    .populate('candidateId', 'fullName status desiredCountry')
    .populate('demandId', 'jobTitle sponsorName');
  res.status(201).json(populated);
});

const updateContract = asyncHandler(async (req, res) => {
  const contract = await WorkerContract.findOne(scopeFilter(req, { _id: req.params.id }));
  if (!contract) return res.status(404).json({ message: 'Contract not found' });

  const updates = { ...req.body };
  delete updates.candidateId;
  delete updates.agencyId;

  if (req.file) updates.contractFileUrl = req.file.path;

  // Re-calculate expiry if start or duration changed
  const startDate = updates.contractStartDate || contract.contractStartDate;
  const duration = updates.contractDurationMonths || contract.contractDurationMonths;
  if ((updates.contractStartDate || updates.contractDurationMonths) && startDate && duration && !updates.contractExpiryDate) {
    const expiry = new Date(startDate);
    expiry.setMonth(expiry.getMonth() + parseInt(duration));
    updates.contractExpiryDate = expiry;
  }

  if (updates.status === 'renewed') updates.renewalCount = (contract.renewalCount || 0) + 1;

  const updated = await WorkerContract.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  )
    .populate('candidateId', 'fullName status desiredCountry')
    .populate('demandId', 'jobTitle sponsorName');

  const activityDetails = [];
  if (updates.status) activityDetails.push(`Status: ${updates.status}`);
  if (updates.salary) activityDetails.push(`Salary: ${updates.salary} ${updates.salaryCurrency || contract.salaryCurrency}`);
  if (req.file) activityDetails.push('File uploaded');

  if (activityDetails.length > 0) {
    await logActivity({
      candidateId: contract.candidateId,
      agencyId: req.user.agencyId,
      userId: req.user.userId,
      userName: req.user.name,
      columnId: 'contract',
      action: updates.status ? 'status_changed' : 'updated',
      details: activityDetails.join(', '),
      previousValue: contract.status,
      newValue: updates.status,
      referenceId: contract._id,
      referenceModel: 'WorkerContract'
    });
  }

  invalidateAlertCache(req.user.agencyId);

  res.status(200).json(updated);
});

const deleteContract = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Only admin can delete contracts' });
  }

  const contract = await WorkerContract.findOne(scopeFilter(req, { _id: req.params.id }));
  if (!contract) return res.status(404).json({ message: 'Contract not found' });

  await WorkerContract.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'Contract deleted successfully' });
});

export default { getContracts, getContractById, getContractByCandidate, getExpiringContracts, createContract, updateContract, deleteContract };
