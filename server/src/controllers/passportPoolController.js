import mongoose from 'mongoose';
import Passport from '../models/Passport.js';
import JobDemand from '../models/JobDemand.js';
import Candidate, { NEPAL_DISTRICTS_LIST } from '../models/Candidate.js';
import PassportLog from '../models/PassportLog.js';
import asyncHandler from '../utils/asyncHandler.js';
import { adToBS, formatBSDisplay } from '../utils/bsDate.js';
import { scopeFilter, scopeData } from '../utils/tenantHelper.js';

// Map legacy district typos (free-form on Passport) to the canonical enum
// values required on Candidate. If we can't recognize it, leave the field
// unset rather than blocking the whole allocation with a validation error.
const DISTRICT_ALIAS_MAP = {
  'sindhupalachok': 'Sindhupalchok',
  'sindupalchok':   'Sindhupalchok',
  'kavre':          'Kavrepalanchok',
  'kavrepalanchowk':'Kavrepalanchok',
  'newalparasi':    'Nawalparasi',
};

const sanitizeDistrict = (raw) => {
  if (!raw || typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (NEPAL_DISTRICTS_LIST.includes(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  const exact = NEPAL_DISTRICTS_LIST.find((d) => d.toLowerCase() === lower);
  if (exact) return exact;
  if (DISTRICT_ALIAS_MAP[lower]) return DISTRICT_ALIAS_MAP[lower];
  return undefined;
};

const getPoolPassports = asyncHandler(async (req, res) => {
  const { 
    gender, 
    ageMin, 
    ageMax, 
    district, 
    desiredCountry, 
    passportValidMonths,
    search,
    page = 1,
    limit = 20
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = scopeFilter(req);

  if (gender) filter.gender = gender;
  if (ageMin || ageMax) {
    filter.age = {};
    if (ageMin) filter.age.$gte = parseInt(ageMin);
    if (ageMax) filter.age.$lte = parseInt(ageMax);
  }
  if (district) filter.districtOfOrigin = district;
  if (desiredCountry) filter.desiredCountry = desiredCountry;
  
  if (passportValidMonths) {
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() + parseInt(passportValidMonths));
    filter.expiryDate = { $gte: minDate };
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { passportNumber: searchRegex },
      { fullName: searchRegex }
    ];
  }

  // Only show passports that are actually in the pool
  filter.allocationStatus = 'in_pool';

  const [passports, total] = await Promise.all([
    Passport.find(filter)
      .sort({ collectedAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('collectedBy', 'name'),
    Passport.countDocuments(filter)
  ]);

  const passportsWithMeta = passports.map(p => {
    const pObj = p.toObject();
    pObj.daysInPool = Math.floor((new Date() - new Date(p.collectedAt)) / (1000 * 60 * 60 * 24));
    pObj.validityMonths = p.expiryDate 
      ? Math.max(0, (p.expiryDate.getFullYear() - new Date().getFullYear()) * 12 + (p.expiryDate.getMonth() - new Date().getMonth()))
      : 0;
    pObj.expiryDateBS = p.expiryDate ? formatBSDisplay(p.expiryDate) : null;
    return pObj;
  });

  res.status(200).json({
    data: passportsWithMeta,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
});

const getAllocatedPassports = asyncHandler(async (req, res) => {
  const { 
    gender, 
    ageMin, 
    ageMax, 
    district,
    search,
    page = 1,
    limit = 20
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = scopeFilter(req, { allocationStatus: 'allocated' });

  if (gender) filter.gender = gender;
  if (ageMin || ageMax) {
    filter.age = {};
    if (ageMin) filter.age.$gte = parseInt(ageMin);
    if (ageMax) filter.age.$lte = parseInt(ageMax);
  }
  if (district) filter.districtOfOrigin = district;

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { passportNumber: searchRegex },
      { fullName: searchRegex }
    ];
  }

  const [passports, total] = await Promise.all([
    Passport.find(filter)
      .sort({ allocatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('allocatedToDemandId', 'employerCompanyName employerCountry jobCategory')
      .populate('candidateId', 'fullName phone status')
      .populate('allocatedBy', 'name'),
    Passport.countDocuments(filter)
  ]);

  res.status(200).json({
    data: passports,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
});

const getMatchingPassports = asyncHandler(async (req, res) => {
  const { demandId } = req.query;

  if (!demandId) {
    return res.status(400).json({ message: 'demandId is required' });
  }

  const demand = await JobDemand.findOne(scopeFilter(req, {
    _id: demandId
  }));

  if (!demand) {
    return res.status(404).json({ message: 'Demand not found' });
  }

  const validityRequired = demand.requiredPassportValidityMonths || 6;
  const minExpiryDate = new Date();
  minExpiryDate.setMonth(minExpiryDate.getMonth() + validityRequired);

  const filter = scopeFilter(req, {
    allocationStatus: 'in_pool',
    expiryDate: { $gte: minExpiryDate }
  });

  if (demand.minAge) {
    filter.age = { ...filter.age, $gte: demand.minAge };
  }
  if (demand.maxAge) {
    filter.age = { ...filter.age, $lte: demand.maxAge };
  }
  if (demand.genderPreference && demand.genderPreference !== 'any') {
    filter.gender = demand.genderPreference;
  }

  const passports = await Passport.find(filter)
    .sort({ collectedAt: 1, expiryDate: -1 })
    .populate('collectedBy', 'name');

  const passportsWithMeta = passports.map(p => {
    const pObj = p.toObject();
    pObj.daysInPool = Math.floor((new Date() - new Date(p.collectedAt)) / (1000 * 60 * 60 * 24));
    pObj.validityMonths = p.expiryDate 
      ? Math.max(0, (p.expiryDate.getFullYear() - new Date().getFullYear()) * 12 + (p.expiryDate.getMonth() - new Date().getMonth()))
      : 0;
    pObj.expiryDateBS = p.expiryDate ? formatBSDisplay(p.expiryDate) : null;
    pObj.isCompatible = true;
    return pObj;
  });

  res.status(200).json({
    demand: {
      id: demand._id,
      employerCompanyName: demand.employerCompanyName,
      employerCountry: demand.employerCountry,
      jobCategory: demand.jobCategory,
      remainingPositions: demand.totalPositions - demand.filledPositions,
      minAge: demand.minAge,
      maxAge: demand.maxAge,
      genderPreference: demand.genderPreference
    },
    passports: passportsWithMeta
  });
});

const allocatePassport = asyncHandler(async (req, res) => {
  const { 
    passportId, 
    demandId, 
    phone, 
    address, 
    agentName, 
    agentNumber, 
    serviceFeeAgreed 
  } = req.body;

  if (!passportId || !demandId) {
    return res.status(400).json({ message: 'passportId and demandId are required' });
  }

  const executeAllocation = async (session = null) => {
    const sessionOptions = session ? { session } : {};

    // For transaction mode, keep existing compact flow.
    if (session) {
      const passport = await Passport.findOneAndUpdate(
        scopeFilter(req, { _id: passportId, allocationStatus: 'in_pool' }),
        {
          $set: {
            allocationStatus: 'allocated',
            allocatedAt: new Date(),
            allocatedBy: req.user.userId,
            contactPhone: phone,
            contactAddress: address,
            agentName: agentName,
            agentNumber: agentNumber,
            serviceFeeAgreed: serviceFeeAgreed,
            allocatedToDemandId: demandId
          }
        },
        { new: true, ...sessionOptions }
      );

      if (!passport) throw new Error('Passport not found or already allocated');

      const demand = await JobDemand.findOneAndUpdate(
        scopeFilter(req, {
          _id: demandId,
          $expr: { $lt: ["$filledPositions", "$totalPositions"] }
        }),
        { $inc: { filledPositions: 1 } },
        { new: true, ...sessionOptions }
      );

      if (!demand) throw new Error('Demand is fully filled or not found');

      // Prefer the existing stub candidate linked to this passport (by id or
      // passport number) so allocation enriches it instead of creating a duplicate.
      const existingCandidate = await Candidate.findOne(
        scopeFilter(req, passport.candidateId
          ? { _id: passport.candidateId }
          : { $or: [{ passportId: passport._id }, { passportNumber: passport.passportNumber }] })
      ).session(session);

      const allocationFields = scopeData(req, {
        fullName: passport.fullName,
        dateOfBirth: passport.dateOfBirth,
        gender: passport.gender || 'male',
        nationalIdNumber: passport.passportNumber,
        phone: phone || passport.contactPhone || '',
        permanentDistrict: sanitizeDistrict(passport.districtOfOrigin || passport.issuedDistrict),
        passportId: passport._id,
        passportNumber: passport.passportNumber,
        demandId: demand._id,
        desiredCountry: demand.employerCountry,
        desiredJobCategory: demand.jobCategory,
        address: address,
        agentName: agentName,
        agentNumber: agentNumber,
        serviceFeeAgreed: serviceFeeAgreed,
        status: 'demand_allocated',
        agentId: req.user.userId
      });

      let candidate;
      if (existingCandidate) {
        candidate = await Candidate.findByIdAndUpdate(
          existingCandidate._id,
          { $set: allocationFields },
          { new: true, ...sessionOptions }
        );
      } else {
        candidate = (await Candidate.create([{ ...allocationFields, registeredAt: new Date() }], sessionOptions))[0];
      }

      await JobDemand.findByIdAndUpdate(
        demand._id,
        { $addToSet: { assignedCandidates: candidate._id } },
        sessionOptions
      );

      await Passport.findByIdAndUpdate(
        passport._id,
        { $set: { candidateId: candidate._id } },
        sessionOptions
      );

      const logData = scopeData(req, {
        passportId: passport._id,
        performedBy: req.user.userId,
        action: 'allocated_to_demand',
        toStatus: 'allocated',
        notes: `Allocated to demand: ${demand.employerCompanyName} (${demand.employerCountry})`
      });

      await PassportLog.create([logData], sessionOptions);
      return { passport, candidate, demand };
    }

    // Non-transaction mode: perform in rollback-safe order.
    const passport = await Passport.findOne(scopeFilter(req, { _id: passportId, allocationStatus: 'in_pool' }));
    if (!passport) throw new Error('Passport not found or already allocated');

    const demand = await JobDemand.findOne(scopeFilter(req, {
      _id: demandId,
      $expr: { $lt: ["$filledPositions", "$totalPositions"] }
    }));
    if (!demand) throw new Error('Demand is fully filled or not found');

    // Prefer the existing stub candidate linked to this passport (by id or
    // passport number) so allocation enriches it instead of creating a duplicate.
    const existingCandidate = await Candidate.findOne(
      scopeFilter(req, passport.candidateId
        ? { _id: passport.candidateId }
        : { $or: [{ passportId: passport._id }, { passportNumber: passport.passportNumber }] })
    );

    const allocationFields = scopeData(req, {
      fullName: passport.fullName,
      dateOfBirth: passport.dateOfBirth,
      gender: passport.gender || 'male',
      nationalIdNumber: passport.passportNumber,
      phone: phone || passport.contactPhone || '',
      permanentDistrict: sanitizeDistrict(passport.districtOfOrigin || passport.issuedDistrict),
      passportId: passport._id,
      passportNumber: passport.passportNumber,
      demandId: demand._id,
      desiredCountry: demand.employerCountry,
      desiredJobCategory: demand.jobCategory,
      address: address,
      agentName: agentName,
      agentNumber: agentNumber,
      serviceFeeAgreed: serviceFeeAgreed,
      status: 'demand_allocated',
      agentId: req.user.userId
    });

    let candidate = null;
    // Snapshot the pre-allocation state so rollback can restore the stub
    // candidate (instead of deleting it, which would lose user-edited data).
    const preExistingCandidateSnapshot = existingCandidate ? existingCandidate.toObject() : null;
    let createdNewCandidate = false;

    try {
      if (existingCandidate) {
        candidate = await Candidate.findByIdAndUpdate(
          existingCandidate._id,
          { $set: allocationFields },
          { new: true }
        );
      } else {
        candidate = await Candidate.create({ ...allocationFields, registeredAt: new Date() });
        createdNewCandidate = true;
      }

      const updatedPassport = await Passport.findOneAndUpdate(
        scopeFilter(req, { _id: passportId, allocationStatus: 'in_pool' }),
        {
          $set: {
            allocationStatus: 'allocated',
            allocatedAt: new Date(),
            allocatedBy: req.user.userId,
            contactPhone: phone,
            contactAddress: address,
            agentName: agentName,
            agentNumber: agentNumber,
            serviceFeeAgreed: serviceFeeAgreed,
            allocatedToDemandId: demandId,
            candidateId: candidate._id
          }
        },
        { new: true }
      );

      if (!updatedPassport) {
        throw new Error('Passport not found or already allocated');
      }

      const updatedDemand = await JobDemand.findOneAndUpdate(
        scopeFilter(req, {
          _id: demandId,
          $expr: { $lt: ["$filledPositions", "$totalPositions"] }
        }),
        {
          $inc: { filledPositions: 1 },
          $addToSet: { assignedCandidates: candidate._id }
        },
        { new: true }
      );

      if (!updatedDemand) {
        throw new Error('Demand is fully filled or not found');
      }

      await PassportLog.create(scopeData(req, {
        passportId: updatedPassport._id,
        performedBy: req.user.userId,
        action: 'allocated_to_demand',
        toStatus: 'allocated',
        notes: `Allocated to demand: ${updatedDemand.employerCompanyName} (${updatedDemand.employerCountry})`
      }));

      return { passport: updatedPassport, candidate, demand: updatedDemand };
    } catch (error) {
      // Rollback best-effort for non-transaction mode.
      if (createdNewCandidate && candidate?._id) {
        await Candidate.findByIdAndDelete(candidate._id);
      } else if (preExistingCandidateSnapshot) {
        // Restore the stub candidate to its pre-allocation state.
        const { _id, __v, createdAt, updatedAt, ...restorable } = preExistingCandidateSnapshot;
        await Candidate.findByIdAndUpdate(_id, { $set: restorable });
      }
      await Passport.findOneAndUpdate(
        scopeFilter(req, { _id: passportId }),
        {
          $set: {
            allocationStatus: 'in_pool',
            candidateId: preExistingCandidateSnapshot?._id || null,
            allocatedToDemandId: null,
            allocatedAt: null,
            allocatedBy: null
          }
        }
      );
      throw error;
    }
  };

  const session = await mongoose.startSession();
  let allocationResults;

  try {
    try {
      await session.withTransaction(async () => {
        allocationResults = await executeAllocation(session);
      });
    } catch (error) {
      const message = error?.message || '';
      const transactionUnsupported = message.includes('Transaction numbers are only allowed on a replica set member or mongos');
      if (!transactionUnsupported) throw error;

      allocationResults = await executeAllocation(null);
    }

    const populatedPassport = await Passport.findById(allocationResults.passport._id)
      .populate('allocatedToDemandId', 'employerCompanyName employerCountry jobCategory')
      .populate('candidateId', 'fullName phone status registeredAt')
      .populate('allocatedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Passport allocated and candidate created successfully',
      passport: populatedPassport,
      candidate: allocationResults.candidate,
      demand: {
        ...allocationResults.demand.toObject(),
        remainingPositions: allocationResults.demand.totalPositions - allocationResults.demand.filledPositions
      }
    });
  } catch (error) {
    const errorMessage = error.message || 'Failed to allocate passport';
    res.status(400).json({ 
      success: false,
      message: errorMessage 
    });
  } finally {
    await session.endSession();
  }
});

const deallocatePassport = asyncHandler(async (req, res) => {
  const { passportId } = req.params;
  const { reason } = req.body;

  const passport = await Passport.findOneAndUpdate(
    scopeFilter(req, { _id: passportId, allocationStatus: 'allocated' }),
    {
      $set: {
        allocationStatus: 'in_pool',
        candidateId: null,
        allocatedToDemandId: null,
        allocatedAt: null,
        allocatedBy: null
      }
    }
  );

  if (!passport) {
    return res.status(404).json({ message: 'Passport not found or not allocated' });
  }

  if (passport.candidateId) {
    await Candidate.findByIdAndUpdate(passport.candidateId, {
      $set: {
        status: 'registered',
        demandId: null,
      },
      $unset: { assignedDemand: 1, desiredCountry: 1, desiredJobCategory: 1 }
    });
  }

  const demandId = passport.allocatedToDemandId;
  if (demandId) {
    await JobDemand.findByIdAndUpdate(demandId, {
      $inc: { filledPositions: -1 },
      ...(passport.candidateId ? { $pull: { assignedCandidates: passport.candidateId } } : {})
    });
  }

  await PassportLog.create(scopeData(req, {
    passportId: passport._id,
    performedBy: req.user.userId,
    action: 'returned_to_pool',
    fromStatus: 'allocated',
    toStatus: 'in_pool',
    notes: reason || 'Returned to passport pool'
  }));

  res.status(200).json({
    success: true,
    message: 'Passport returned to pool successfully',
    passport: await Passport.findById(passportId)
  });
});

const getActiveDemands = asyncHandler(async (req, res) => {
  const demands = await JobDemand.find(scopeFilter(req, {
    status: 'active'
  })).select('employerCompanyName employerCountry jobCategory totalPositions filledPositions minAge maxAge genderPreference');

  const demandsWithRemaining = demands.map(d => ({
    ...d.toObject(),
    remainingPositions: d.totalPositions - d.filledPositions
  })).filter(d => d.remainingPositions > 0);

  res.status(200).json(demandsWithRemaining);
});

const getPoolStats = asyncHandler(async (req, res) => {
  const [inPoolCount, allocatedCount, activeDemandsCount] = await Promise.all([
    Passport.countDocuments(scopeFilter(req, { allocationStatus: 'in_pool' })),
    Passport.countDocuments(scopeFilter(req, { allocationStatus: 'allocated' })),
    JobDemand.countDocuments(scopeFilter(req, { status: 'active' }))
  ]);

  const candidatesByStatus = await Candidate.aggregate([
    { $match: scopeFilter(req, {}, true) },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const candidateStatusCounts = candidatesByStatus.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  res.status(200).json({
    inPool: inPoolCount,
    allocated: allocatedCount,
    activeDemands: activeDemandsCount,
    candidates: candidateStatusCounts
  });
});

export default {
  getPoolPassports,
  getAllocatedPassports,
  getMatchingPassports,
  allocatePassport,
  deallocatePassport,
  getActiveDemands,
  getPoolStats
};