import Candidate from "../models/Candidate.js";
import Passport from "../models/Passport.js";
import JobDemand from "../models/JobDemand.js";
import Medical from "../models/Medical.js";
import Orientation from "../models/Orientation.js";
import InsuranceSsf from "../models/InsuranceSsf.js";
import FeeTransaction from "../models/FeeTransaction.js";
import Task from "../models/Task.js";
import DepartedRecord from "../models/DepartedRecord.js";
import asyncHandler from "../utils/asyncHandler.js";
import { scopeFilter } from "../utils/tenantHelper.js";

// Build a frozen snapshot combining candidate + passport + demand data
const buildSnapshot = (candidate, passport, demand) => ({
  originalCandidateId: candidate._id,
  originalPassportId: passport?._id,
  demandId: demand?._id,
  agencyId: candidate.agencyId,

  // Personal (from candidate, authoritative after allocation)
  fullName: candidate.fullName,
  fullNameNepali: candidate.fullNameNepali,
  dateOfBirth: candidate.dateOfBirth,
  gender: candidate.gender,
  phone: candidate.phone,
  permanentDistrict: candidate.permanentDistrict,
  permanentAddress: candidate.permanentAddress,
  nationalIdNumber: candidate.nationalIdNumber,

  // Passport
  passportNumber: passport?.passportNumber || candidate.passportNumber,
  passportIssueDate: passport?.issueDate,
  passportExpiryDate: passport?.expiryDate,
  passportIssuedDistrict: passport?.issuedDistrict,

  // Job / Demand
  employerCountry: demand?.employerCountry || candidate.demandCountry,
  employerCompanyName: demand?.employerCompanyName,
  jobCategory: candidate.demandJobCategory || demand?.jobCategory,
  demandLetterNumber: demand?.demandLetterNumber,

  // Flight / Departure
  flightDate: candidate.flightDate,
  departedAt: candidate.departedAt || new Date(),
  flightNumber: candidate.flightNumber,
  portOfDeparture: candidate.portOfDeparture,

  // Visa / Shram
  visaNumber: candidate.visaNumber,
  visaExpiryDate: candidate.visaExpiryDate,
  shramNumber: candidate.shramNumber,
  shramExpiryDate: candidate.shramExpiryDate,
  labourPermitNumber: candidate.labourPermitNumber,

  // Financial
  serviceFee: candidate.serviceFee,
  feePaid: candidate.feePaid,
  feeBalance: candidate.feeBalance,

  // Agent
  agentId: candidate.agentId,
  agentName: candidate.agentName,

  // Files snapshot
  files: {
    passportFile: passport?.fileUrl,
    visaFile: candidate.visaFileUrl,
    feimsFile: candidate.feimsFileUrl,
    departureFile: candidate.departureFileUrl,
  },

  returnStatus: "abroad",
});

// POST /candidates/:id/depart
export const markCandidateDeparted = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findOne(
    scopeFilter(req, { _id: req.params.id }),
  ).lean();

  if (!candidate)
    return res.status(404).json({ message: "Candidate not found" });

  const [passport, demand] = await Promise.all([
    candidate.passportId
      ? Passport.findById(candidate.passportId).lean()
      : candidate.passportNumber
        ? Passport.findOne({
            agencyId: candidate.agencyId,
            passportNumber: candidate.passportNumber,
          }).lean()
        : null,
    candidate.demandId ? JobDemand.findById(candidate.demandId).lean() : null,
  ]);

  // Create the permanent departed record
  const record = await DepartedRecord.create({
    ...buildSnapshot(candidate, passport, demand),
    departedBy: req.user.userId,
  });

  // Mark passport as departed, clear candidate link
  if (passport) {
    await Passport.findByIdAndUpdate(passport._id, {
      $set: {
        allocationStatus: "departed",
        candidateId: null,
        allocatedToDemandId: null,
        allocatedAt: null,
        allocatedBy: null,
      },
    });
  }

  // Decrement demand filled positions
  if (candidate.demandId) {
    await JobDemand.findByIdAndUpdate(candidate.demandId, {
      $inc: { filledPositions: -1 },
    });
  }

  // Delete all related sub-records and the candidate itself
  await Promise.all([
    Medical.deleteMany({ candidateId: candidate._id }),
    Orientation.deleteMany({ candidateId: candidate._id }),
    InsuranceSsf.deleteMany({ candidateId: candidate._id }),
    FeeTransaction.deleteMany({ candidateId: candidate._id }),
    Task.deleteMany({ candidateId: candidate._id }),
  ]);
  await Candidate.deleteOne({ _id: candidate._id });

  res
    .status(200)
    .json({ message: "Candidate departed and archived", recordId: record._id });
});

// GET /departed
export const getDepartedRecords = asyncHandler(async (req, res) => {
  const { search, country, returnStatus, year, page = 1 } = req.query;
  const PAGE_SIZE = 25;
  const filter = { agencyId: req.user.agencyId };

  if (search) {
    filter.$text = { $search: search };
  }
  if (country) filter.employerCountry = country;
  if (returnStatus) filter.returnStatus = returnStatus;
  if (year) {
    const y = parseInt(year);
    filter.departedAt = {
      $gte: new Date(`${y}-01-01`),
      $lt: new Date(`${y + 1}-01-01`),
    };
  }

  const [records, total] = await Promise.all([
    DepartedRecord.find(filter)
      .sort({ departedAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    DepartedRecord.countDocuments(filter),
  ]);

  res.json({
    records,
    total,
    page: +page,
    pages: Math.ceil(total / PAGE_SIZE),
  });
});

// GET /departed/stats
export const getDepartedStats = asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;
  const [byCountry, byStatus, total] = await Promise.all([
    DepartedRecord.aggregate([
      { $match: { agencyId } },
      { $group: { _id: "$employerCountry", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    DepartedRecord.aggregate([
      { $match: { agencyId } },
      { $group: { _id: "$returnStatus", count: { $sum: 1 } } },
    ]),
    DepartedRecord.countDocuments({ agencyId }),
  ]);

  const statusMap = {};
  byStatus.forEach((s) => {
    statusMap[s._id] = s.count;
  });

  res.json({
    total,
    abroad: statusMap.abroad || 0,
    returned: statusMap.returned || 0,
    extended: statusMap.extended || 0,
    absconded: statusMap.absconded || 0,
    byCountry,
  });
});

// GET /departed/:id
export const getDepartedById = asyncHandler(async (req, res) => {
  const record = await DepartedRecord.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId,
  }).lean();
  if (!record) return res.status(404).json({ message: "Record not found" });
  res.json(record);
});

// PATCH /departed/:id/return-status
export const updateReturnStatus = asyncHandler(async (req, res) => {
  const { returnStatus, returnNotes, returnDate } = req.body;
  const valid = ["abroad", "returned", "extended", "absconded"];
  if (!valid.includes(returnStatus)) {
    return res.status(400).json({ message: "Invalid return status" });
  }

  const record = await DepartedRecord.findOneAndUpdate(
    { _id: req.params.id, agencyId: req.user.agencyId },
    {
      $set: {
        returnStatus,
        returnNotes,
        returnDate:
          returnDate || (returnStatus === "returned" ? new Date() : undefined),
      },
    },
    { new: true },
  );
  if (!record) return res.status(404).json({ message: "Record not found" });

  // If returned, set passport back to in_pool
  if (returnStatus === "returned" && record.originalPassportId) {
    await Passport.findByIdAndUpdate(record.originalPassportId, {
      $set: { allocationStatus: "in_pool" },
    });
  }

  res.json(record);
});
