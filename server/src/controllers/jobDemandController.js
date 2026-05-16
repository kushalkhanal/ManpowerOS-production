import JobDemand from '../models/JobDemand.js';
import Candidate from '../models/Candidate.js';
import Passport from '../models/Passport.js';
import asyncHandler from '../utils/asyncHandler.js';
import { computeAndSaveCandidateStatus } from '../services/candidateStatusService.js';
import { scopeFilter, scopeData } from '../utils/tenantHelper.js';
import logger from '../config/logger.js';

const createDemand = asyncHandler(async (req, res) => {
  const {
    employerCompanyName, shortCompanyCode, employerCountry, employerCity, employerContactPerson,
    employerPhone, employerEmail, demandLetterNumber, lotNumber, demandLetterDate,
    demandLetterExpiryDate, jobCategory, totalPositions, basicSalaryUSD,
    accommodationProvided, foodProvided, contractDurationMonths, workingHoursPerDay,
    purbaSwukritiNumber, purbaSwukritiDate, purbaSwukritiExpiryDate, notes
  } = req.body;

  if (!employerCompanyName || !employerCountry || !totalPositions || !lotNumber) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  const files = req.files || {};
  const toServedUrl = (f) => (f ? `/uploads/demands/${f.filename}` : undefined);

  const demand = await JobDemand.create({
    agencyId: req.user.agencyId,
    employerCompanyName, shortCompanyCode, employerCountry, employerCity, employerContactPerson,
    employerPhone, employerEmail, demandLetterNumber, lotNumber, demandLetterDate,
    demandLetterExpiryDate, jobCategory, totalPositions,
    basicSalaryUSD, accommodationProvided, foodProvided,
    contractDurationMonths, workingHoursPerDay, purbaSwukritiNumber,
    purbaSwukritiDate, purbaSwukritiExpiryDate, notes,
    demandLetterFileUrl: toServedUrl(files.demandLetter?.[0]),
    powerOfAttorneyFileUrl: toServedUrl(files.powerOfAttorney?.[0]),
    embassyAttestedDemandUrl: toServedUrl(files.embassyAttested?.[0]),
    filledPositions: 0,
    assignedCandidates: []
  });

  res.status(201).json(demand);
});

const getDemands = asyncHandler(async (req, res) => {
  const { status, country, jobCategory, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = { agencyId: req.user.agencyId };
  if (status) filter.status = status;
  if (country) filter.employerCountry = country;
  if (jobCategory) filter.jobCategory = jobCategory;

  const [demands, total] = await Promise.all([
    JobDemand.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('assignedCandidates', 'fullName phone status desiredCountry')
      .lean(),
    JobDemand.countDocuments(filter)
  ]);

  res.status(200).json({
    data: demands,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
});

const getDemandById = asyncHandler(async (req, res) => {
  const demand = await JobDemand.findOne({ _id: req.params.id, agencyId: req.user.agencyId })
    .populate('assignedCandidates', 'fullName passportNumber phone status desiredCountry permanentDistrict serviceFeeAgreed serviceFeeReceived')
    .lean();

  if (!demand) {
    return res.status(404).json({ message: 'Demand not found' });
  }

  // Source-of-truth sync: candidates linked by demandId should always appear in assignedCandidates.
  // Also self-heal legacy records where passport was allocated but candidate row was never created.
  const allocatedPassports = await Passport.find({
    agencyId: req.user.agencyId,
    allocatedToDemandId: demand._id,
    allocationStatus: 'allocated'
  })
    .select('_id fullName dateOfBirth gender passportNumber districtOfOrigin issuedDistrict candidateId contactPhone contactAddress agentName agentNumber serviceFeeAgreed')
    .lean();

  const missingCandidatePassports = allocatedPassports.filter((p) => !p.candidateId);
  if (missingCandidatePassports.length > 0) {
    for (const p of missingCandidatePassports) {
      const repairedCandidate = await Candidate.create(scopeData(req, {
        fullName: p.fullName,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender || 'male',
        nationalIdNumber: p.passportNumber,
        phone: p.contactPhone || '',
        permanentDistrict: p.districtOfOrigin || p.issuedDistrict,
        passportId: p._id,
        passportNumber: p.passportNumber,
        demandId: demand._id,
        desiredCountry: demand.employerCountry,
        desiredJobCategory: demand.jobCategory,
        address: p.contactAddress,
        agentName: p.agentName,
        agentNumber: p.agentNumber,
        serviceFeeAgreed: p.serviceFeeAgreed,
        status: 'demand_allocated',
        agentId: req.user.userId,
        registeredAt: new Date()
      }));

      await Passport.updateOne(
        { _id: p._id, agencyId: req.user.agencyId },
        { $set: { candidateId: repairedCandidate._id } }
      );
    }
  }

  const linkedCandidates = await Candidate.find({
    agencyId: req.user.agencyId,
    demandId: demand._id
  })
    .select('fullName passportNumber phone status desiredCountry permanentDistrict serviceFeeAgreed serviceFeeReceived')
    .lean();

  const mergedById = new Map();
  (demand.assignedCandidates || []).forEach((c) => mergedById.set(c._id.toString(), c));
  linkedCandidates.forEach((c) => mergedById.set(c._id.toString(), c));

  const syncedAssignedCandidates = Array.from(mergedById.values());

  // Repair demand document if stale counts/list are out of sync.
  const needsRepair =
    (demand.assignedCandidates?.length || 0) !== syncedAssignedCandidates.length ||
    demand.filledPositions !== syncedAssignedCandidates.length;

  if (needsRepair) {
    await JobDemand.updateOne(
      { _id: demand._id, agencyId: req.user.agencyId },
      {
        $set: {
          assignedCandidates: syncedAssignedCandidates.map((c) => c._id),
          filledPositions: syncedAssignedCandidates.length,
          status: syncedAssignedCandidates.length >= demand.totalPositions ? 'filled' : demand.status === 'filled' ? 'active' : demand.status
        }
      }
    );
  }

  res.status(200).json({
    ...demand,
    assignedCandidates: syncedAssignedCandidates,
    filledPositions: syncedAssignedCandidates.length
  });
});

const updateDemand = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  delete updates.agencyId;
  delete updates.assignedCandidates;
  delete updates.filledPositions;
  delete updates.createdAt;
  delete updates.updatedAt;

  // Handle file uploads (multipart)
  const uploadedFiles = req.files || {};
  if (uploadedFiles.demandLetter?.[0]) {
    updates.demandLetterFileUrl = `/uploads/demands/${uploadedFiles.demandLetter[0].filename}`;
  }
  if (uploadedFiles.powerOfAttorney?.[0]) {
    updates.powerOfAttorneyFileUrl = `/uploads/demands/${uploadedFiles.powerOfAttorney[0].filename}`;
  }
  if (uploadedFiles.embassyAttested?.[0]) {
    updates.embassyAttestedDemandUrl = `/uploads/demands/${uploadedFiles.embassyAttested[0].filename}`;
  }

  const demand = await JobDemand.findOneAndUpdate(
    { _id: req.params.id, agencyId: req.user.agencyId },
    updates,
    { new: true }
  ).populate('assignedCandidates', 'fullName phone status');

  if (!demand) {
    return res.status(404).json({ message: 'Demand not found' });
  }

  res.status(200).json(demand);
});

const assignCandidate = asyncHandler(async (req, res) => {
  const { candidateId } = req.body;

  if (!candidateId) {
    return res.status(400).json({ message: 'Candidate ID is required' });
  }

  const candidate = await Candidate.findOne({ _id: candidateId, agencyId: req.user.agencyId });
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  // Atomic update to JobDemand: ensure we don't exceed totalPositions
  // and ensure candidate isn't already assigned
  const demand = await JobDemand.findOneAndUpdate(
    {
      _id: req.params.id,
      agencyId: req.user.agencyId,
      assignedCandidates: { $ne: candidateId },
      $expr: { $lt: ["$filledPositions", "$totalPositions"] }
    },
    {
      $push: { assignedCandidates: candidateId },
      $inc: { filledPositions: 1 }
    },
    { new: true }
  );

  if (!demand) {
    // Check why it failed
    const checkDemand = await JobDemand.findById(req.params.id);
    if (!checkDemand) return res.status(404).json({ message: 'Demand not found' });
    if (checkDemand.filledPositions >= checkDemand.totalPositions) {
      return res.status(400).json({ message: 'All positions are already filled' });
    }
    if (checkDemand.assignedCandidates.some(c => c.toString() === candidateId)) {
      return res.status(400).json({ message: 'Candidate already assigned to this demand' });
    }
    return res.status(400).json({ message: 'Failed to assign candidate' });
  }

  // Check country match (Soft constraint, can be hard if needed)
  if (candidate.desiredCountry !== demand.employerCountry) {
    logger.warn(`Country mismatch for candidate ${candidateId} assignment`);
  }

  // Update candidate side
  await Candidate.findByIdAndUpdate(candidateId, { 
    demandId: demand._id, // Set the correct field (models showed demandId)
    assignedDemand: demand._id // Keep as fallback if used elsewhere
  });

  // Recompute status
  await computeAndSaveCandidateStatus(candidateId);

  // Check if we need to update demand status to 'filled'
  if (demand.filledPositions >= demand.totalPositions) {
    await JobDemand.findByIdAndUpdate(demand._id, { status: 'filled' });
  }

  const updatedDemand = await JobDemand.findById(demand._id)
    .populate('assignedCandidates', 'fullName phone status desiredCountry');

  res.status(200).json(updatedDemand);
});

const removeCandidate = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;

  const demand = await JobDemand.findOneAndUpdate(
    {
      _id: req.params.id,
      agencyId: req.user.agencyId,
      assignedCandidates: candidateId
    },
    {
      $pull: { assignedCandidates: candidateId },
      $inc: { filledPositions: -1 }
    },
    { new: true }
  );

  if (!demand) {
    return res.status(404).json({ message: 'Demand not found or candidate not assigned' });
  }

  // Update status to active if it was filled
  if (demand.status === 'filled' && demand.filledPositions < demand.totalPositions) {
    await JobDemand.findByIdAndUpdate(demand._id, { status: 'active' });
  }

  // Update candidate side
  await Candidate.findByIdAndUpdate(candidateId, { 
    $unset: { demandId: 1, assignedDemand: 1 } 
  });

  // Recompute candidate status
  await computeAndSaveCandidateStatus(candidateId);

  const updatedDemand = await JobDemand.findById(demand._id)
    .populate('assignedCandidates', 'fullName phone status desiredCountry');

  res.status(200).json(updatedDemand);
});

const getExpiringDemands = asyncHandler(async (req, res) => {
  const fourteenDaysFromNow = new Date();
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

  const expiring = await JobDemand.find({
    agencyId: req.user.agencyId,
    status: 'active',
    demandLetterExpiryDate: { $lte: fourteenDaysFromNow, $gte: new Date() }
  })
    .sort({ demandLetterExpiryDate: 1 })
    .lean();

  const enriched = expiring.map(d => {
    const daysUntilExpiry = Math.ceil((new Date(d.demandLetterExpiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return { ...d, daysUntilExpiry };
  });

  res.status(200).json(enriched);
});

const getEligibleCandidates = asyncHandler(async (req, res) => {
  const demand = await JobDemand.findOne({ _id: req.params.id, agencyId: req.user.agencyId });
  if (!demand) {
    return res.status(404).json({ message: 'Demand not found' });
  }

  const assignedCandidateIds = demand.assignedCandidates;

  const candidates = await Candidate.find({
    agencyId: req.user.agencyId,
    desiredCountry: demand.employerCountry,
    status: { $in: ['medical_passed', 'insurance_done'] },
    _id: { $nin: assignedCandidateIds }
  }).select('fullName phone status desiredCountry permanentDistrict').lean();

  res.status(200).json(candidates);
});

const deleteDemand = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Only admin can delete demands' });
  }

  const demand = await JobDemand.findOneAndDelete({ _id: req.params.id, agencyId: req.user.agencyId });
  if (!demand) {
    return res.status(404).json({ message: 'Demand not found' });
  }

  // Cascading cleanup for candidates
  const assignedIds = demand.assignedCandidates || [];
  if (assignedIds.length > 0) {
    await Candidate.updateMany(
      { _id: { $in: assignedIds } },
      { $unset: { demandId: 1, assignedDemand: 1 } }
    );
    
    // Recompute statuses for all affected candidates
    for (const cId of assignedIds) {
      await computeAndSaveCandidateStatus(cId);
    }
  }

  res.status(200).json({ message: 'Demand deleted successfully' });
});

export default {
  createDemand,
  getDemands,
  getDemandById,
  updateDemand,
  assignCandidate,
  removeCandidate,
  getExpiringDemands,
  getEligibleCandidates,
  deleteDemand
};