import mongoose from 'mongoose';
import Passport from '../models/Passport.js';
import Candidate from '../models/Candidate.js';
import SharedDocument from '../models/SharedDocument.js';
import Medical from '../models/Medical.js';
import InsuranceSsf from '../models/InsuranceSsf.js';
import Orientation from '../models/Orientation.js';
import DemandAssignment from '../models/DemandAssignment.js';
import JobDemand from '../models/JobDemand.js';
import asyncHandler from '../utils/asyncHandler.js';
import { scopeFilter, scopeData } from '../utils/tenantHelper.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { handlePassportDuplicate } from '../utils/passportDuplicateError.js';

// POST /api/persons — combined intake (passport + candidate).
// Passport number is the primary key; the same number twice throws
// a friendly 409 with the existing person's name + candidate id + status.
export const createPerson = asyncHandler(async (req, res) => {
  const {
    // Passport (identity) fields
    passportNumber,
    fullName,
    fullNameNepali,
    dateOfBirth,
    gender,
    issueDate,
    expiryDate,
    issuedDistrict,
    location,
    notes,
    // Candidate (workflow) fields — everything else
    candidate = {}
  } = req.body;

  if (!passportNumber || !fullName || !dateOfBirth || !gender) {
    return res.status(400).json({
      message:
        'passportNumber, fullName, dateOfBirth, and gender are required'
    });
  }

  const agencyId = req.user.agencyId;
  if (!agencyId) {
    return res.status(400).json({ message: 'Agency context is required' });
  }

  const session = await mongoose.startSession();
  let result;

  const run = async (s) => {
    const passportDoc = (
      await Passport.create(
        [
          {
            agencyId,
            passportNumber: String(passportNumber).trim().toUpperCase(),
            fullName,
            fullNameNepali,
            dateOfBirth,
            gender,
            issueDate,
            expiryDate,
            issuedDistrict,
            location,
            notes,
            collectedBy: req.user.userId,
            collectedAt: new Date(),
            custodyStatus: 'with_agency',
            allocationStatus: 'in_pool'
          }
        ],
        s ? { session: s } : {}
      )
    )[0];

    // New intake lands in the pool — visible on /passports, hidden from
    // /candidates until a demand is allocated. Status flips to
    // 'demand_allocated' (and the row becomes visible on /candidates)
    // when an admin allocates this passport to a demand.
    const candidateDoc = (
      await Candidate.create(
        [
          scopeData(req, {
            ...candidate,
            passportId: passportDoc._id,
            status: 'passport_collected',
            registeredAt: new Date(),
            agentId: candidate.agentId || req.user.userId
          })
        ],
        s ? { session: s } : {}
      )
    )[0];

    await Passport.updateOne(
      { _id: passportDoc._id },
      { $set: { candidateId: candidateDoc._id } },
      s ? { session: s } : {}
    );

    await SharedDocument.create(
      [
        {
          agencyId,
          candidateId: candidateDoc._id
        }
      ],
      s ? { session: s } : {}
    );

    return { passport: passportDoc, candidate: candidateDoc };
  };

  try {
    try {
      await session.withTransaction(async () => {
        result = await run(session);
      });
    } catch (err) {
      // Standalone MongoDB doesn't support transactions; fall back.
      if (
        err?.message?.includes(
          'Transaction numbers are only allowed on a replica set'
        )
      ) {
        result = await run(null);
      } else {
        throw err;
      }
    }
  } catch (err) {
    const handled = await handlePassportDuplicate(err, req, res);
    if (handled) {
      await session.endSession();
      return;
    }
    await session.endSession();
    throw err;
  }

  await session.endSession();
  res.status(201).json({
    passport: result.passport,
    candidate: result.candidate
  });
});

// GET /api/persons/search?q=...
// Searches passport name + passportNumber, returns unified rows.
export const searchPersons = asyncHandler(async (req, res) => {
  const { q = '', limit = 20 } = req.query;
  const max = Math.min(parseInt(limit, 10) || 20, 100);
  if (!q.trim()) return res.status(200).json({ data: [] });

  const filter = scopeFilter(req);
  const regex = new RegExp(escapeRegex(q), 'i');
  filter.$or = [
    { fullName: regex },
    { fullNameNepali: regex },
    { passportNumber: regex }
  ];

  const passports = await Passport.find(filter)
    .limit(max)
    .populate(
      'candidateId',
      'status phone desiredCountry agentName paymentStatus'
    )
    .lean();

  const rows = passports.map((p) => ({
    candidateId: p.candidateId?._id || null,
    passportId: p._id,
    passportNumber: p.passportNumber,
    fullName: p.fullName,
    fullNameNepali: p.fullNameNepali,
    status: p.candidateId?.status || 'in_pool',
    phone: p.candidateId?.phone,
    desiredCountry: p.candidateId?.desiredCountry,
    paymentStatus: p.candidateId?.paymentStatus,
    expiryDate: p.expiryDate,
    allocationStatus: p.allocationStatus
  }));

  res.status(200).json({ data: rows });
});

// GET /api/persons/:candidateId — unified profile blob.
export const getPersonProfile = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findOne(
    scopeFilter(req, { _id: req.params.candidateId })
  ).lean();

  if (!candidate) {
    return res.status(404).json({ message: 'Person not found' });
  }

  const [
    passport,
    documents,
    medicals,
    insurance,
    orientations,
    demandAssignments
  ] = await Promise.all([
    Passport.findById(candidate.passportId).lean(),
    SharedDocument.findOne({ candidateId: candidate._id }).lean(),
    Medical.find({ candidateId: candidate._id })
      .sort({ createdAt: -1 })
      .lean(),
    InsuranceSsf.findOne({ candidateId: candidate._id }).lean(),
    Orientation.find({ candidateId: candidate._id })
      .sort({ startDate: -1 })
      .lean(),
    DemandAssignment.find({ candidateId: candidate._id })
      .populate(
        'demandId',
        'employerCompanyName employerCountry jobCategory lotNumber status'
      )
      .sort({ assignedAt: -1 })
      .lean()
  ]);

  res.status(200).json({
    candidate,
    passport,
    documents: documents || {},
    medical: medicals,
    insurance,
    orientation: orientations,
    demands: demandAssignments
  });
});
