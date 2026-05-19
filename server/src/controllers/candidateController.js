import mongoose from "mongoose";
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
import { buildCursorFilter, buildCursorPage } from "../utils/pagination.js";
import { invalidateAlertCache } from "../cache/alertCache.js";
import {
  deleteCloudinaryFile,
  getPublicIdFromUrl,
} from "../middleware/upload.js";
import logger from "../config/logger.js";
import { DOCUMENT_CHECKLIST_KEYS } from "../utils/candidateChecklist.js";
import { enrichWithCompliance, addDaysSinceRegistered } from "../utils/candidateEnrich.js";
import {
  buildPassportCollectionColumn,
  buildMedicalColumn,
  buildInsuranceColumn,
  buildCallingVisaColumn,
  buildVisaColumn,
  buildFeeColumn,
  buildFlightColumn,
  buildDofeColumn,
  buildDocPrepColumn,
  buildDepartureColumn,
  getNextAction,
  getBlockedBy,
} from "../builders/kanbanColumnBuilders.js";

// Fields owned by the Passport record — must not be edited on Candidate directly
// once a passportId is linked. Changes flow Passport → Candidate only.
const PASSPORT_OWNED_FIELDS = [
  "fullName",
  "dateOfBirth",
  "gender",
  "passportNumber",
];

const getCandidates = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    desiredCountry,
    agentId,
    page = 1,
    limit = 20,
    includeCompliance,
  } = req.query;

  const baseFilter = scopeFilter(req);
  if (status) baseFilter.status = status;
  if (desiredCountry) baseFilter.desiredCountry = desiredCountry;
  if (agentId) baseFilter.agentId = agentId;
  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");
    baseFilter.$or = [
      { fullName: searchRegex },
      { phone: searchRegex },
      { nationalIdNumber: searchRegex },
    ];
  }

  const { filter, limitNumber, hasCursor } = buildCursorFilter(
    req.query,
    baseFilter,
    "registeredAt",
  );

  if (hasCursor) {
    const candidates = await Candidate.find(filter)
      .sort({ registeredAt: -1, _id: -1 })
      .limit(limitNumber + 1)
      .populate("agentId", "name")
      .lean();

    const cursorPage = buildCursorPage(
      candidates,
      limitNumber,
      undefined,
      "registeredAt",
    );
    const list =
      includeCompliance === "true"
        ? await enrichWithCompliance(cursorPage.data)
        : cursorPage.data;

    return res
      .status(200)
      .json({ ...cursorPage, data: list.map(addDaysSinceRegistered) });
  }

  // Offset pagination (default — used by legacy frontend views)
  const pageNum = Math.max(1, parseInt(page));
  const pageLimit = Math.min(parseInt(limit) || 20, 100);
  const skip = (pageNum - 1) * pageLimit;

  const [candidates, total] = await Promise.all([
    Candidate.find(baseFilter)
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .populate("agentId", "name")
      .lean(),
    Candidate.countDocuments(baseFilter),
  ]);

  const list =
    includeCompliance === "true"
      ? await enrichWithCompliance(candidates)
      : candidates;
  res.status(200).json({
    data: list.map(addDaysSinceRegistered),
    total,
    page: pageNum,
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

  // Drop passport-owned fields when a passport is linked — prevents drift
  const hasPassportLink = await Candidate.exists({
    _id: req.params.id,
    agencyId: req.user.agencyId,
    passportId: { $exists: true, $ne: null },
  });
  if (hasPassportLink) {
    PASSPORT_OWNED_FIELDS.forEach((f) => delete updates[f]);
  }

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
  const oldCandidate = await Candidate.findById(req.params.id);
  const oldStatus = oldCandidate?.status;
  const orphanedFileUrls = [];

  if (uploadedFiles.visaFile?.[0]) {
    if (oldCandidate?.visaFileUrl)
      orphanedFileUrls.push(oldCandidate.visaFileUrl);
    updates.visaFileUrl = uploadedFiles.visaFile[0].path;
  }
  if (uploadedFiles.feimsFile?.[0]) {
    if (oldCandidate?.feimsFileUrl)
      orphanedFileUrls.push(oldCandidate.feimsFileUrl);
    updates.feimsFileUrl = uploadedFiles.feimsFile[0].path;
  }
  if (uploadedFiles.departureFile?.[0]) {
    if (oldCandidate?.departureFileUrl)
      orphanedFileUrls.push(oldCandidate.departureFileUrl);
    updates.departureFileUrl = uploadedFiles.departureFile[0].path;
  }
  if (uploadedFiles.file?.[0]) {
    // Legacy generic 'file' field — preserved as visa for backwards compatibility
    if (oldCandidate?.visaFileUrl)
      orphanedFileUrls.push(oldCandidate.visaFileUrl);
    updates.visaFileUrl = uploadedFiles.file[0].path;
  }

  const candidate = await Candidate.findOneAndUpdate(
    scopeFilter(req, { _id: req.params.id }),
    updates,
    { new: true },
  ).populate("agentId", "name");

  if (!candidate) {
    return res.status(404).json({ message: "Candidate not found" });
  }

  // Fire-and-forget cleanup of replaced Cloudinary assets — don't block the response.
  if (orphanedFileUrls.length > 0) {
    Promise.all(
      orphanedFileUrls
        .map(getPublicIdFromUrl)
        .filter(Boolean)
        .map((publicId) => deleteCloudinaryFile(publicId)),
    ).catch((err) => logger.error("Orphaned upload cleanup failed", err));
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

  const candidateFileFields = [
    "visaFileUrl",
    "feimsFileUrl",
    "vlnFileUrl",
    "plksFileUrl",
    "departureFileUrl",
  ];
  const filesToDelete = candidateFileFields
    .map((field) => candidate[field])
    .filter(Boolean);

  const [medicalDocs, orientationDocs, insuranceDocs] = await Promise.all([
    Medical.find({ candidateId: candidate._id }).select("reportFileUrl").lean(),
    Orientation.find({ candidateId: candidate._id })
      .select("certificateFileUrl attendanceSheetUrl")
      .lean(),
    InsuranceSsf.find({ candidateId: candidate._id })
      .select("insurancePaidReceiptUrl ssfReceiptUrl")
      .lean(),
  ]);
  medicalDocs.forEach(
    (d) => d.reportFileUrl && filesToDelete.push(d.reportFileUrl),
  );
  orientationDocs.forEach((d) => {
    if (d.certificateFileUrl) filesToDelete.push(d.certificateFileUrl);
    if (d.attendanceSheetUrl) filesToDelete.push(d.attendanceSheetUrl);
  });
  insuranceDocs.forEach((d) => {
    if (d.insurancePaidReceiptUrl)
      filesToDelete.push(d.insurancePaidReceiptUrl);
    if (d.ssfReceiptUrl) filesToDelete.push(d.ssfReceiptUrl);
  });

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

  if (candidate.demandId) {
    await JobDemand.findByIdAndUpdate(candidate.demandId, {
      $inc: { filledPositions: -1 },
    });
  }

  await Promise.all([
    Medical.deleteMany({ candidateId: candidate._id }),
    Orientation.deleteMany({ candidateId: candidate._id }),
    InsuranceSsf.deleteMany({ candidateId: candidate._id }),
    FeeTransaction.deleteMany({ candidateId: candidate._id }),
    Task.deleteMany({ candidateId: candidate._id }),
    Candidate.findByIdAndDelete(candidate._id),
  ]);

  if (filesToDelete.length > 0) {
    Promise.all(
      filesToDelete
        .map(getPublicIdFromUrl)
        .filter(Boolean)
        .map((publicId) => deleteCloudinaryFile(publicId)),
    ).catch((err) =>
      logger.error("Candidate delete: Cloudinary cleanup failed", err),
    );
  }

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
    .select("_id name phone address")
    .lean();

  res.status(200).json(agents);
});

const getAgentStats = asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const agencyId = req.user.agencyId;

  const agent = await User.findOne({ _id: agentId, agencyId, role: "agent" })
    .select("_id name phone address")
    .lean();
  if (!agent) return res.status(404).json({ message: "Agent not found" });

  const ACTIVE_STATUSES = [
    "registered",
    "demand_matched",
    "trade_test_scheduled",
    "trade_test_passed",
    "documents_pending",
    "medical_scheduled",
    "medical_fit",
    "calling_visa_received",
    "insurance_done",
    "orientation_done",
    "purba_swukriti_done",
    "visa_stamped",
    "plks_received",
    "feims_submitted",
    "shram_swukriti_done",
    "flight_booked",
  ];

  const [total, active, departed] = await Promise.all([
    Candidate.countDocuments({ agentId, agencyId }),
    Candidate.countDocuments({
      agentId,
      agencyId,
      status: { $in: ACTIVE_STATUSES },
    }),
    Candidate.countDocuments({ agentId, agencyId, status: "departed" }),
  ]);

  const lastCandidate = await Candidate.findOne({ agentId, agencyId })
    .sort({ registeredAt: -1 })
    .select("registeredAt")
    .lean();

  res.status(200).json({
    ...agent,
    stats: {
      total,
      active,
      departed,
      lastReferralDate: lastCandidate?.registeredAt || null,
    },
  });
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

  const columns = [
    buildPassportCollectionColumn(passport, checklistMap, stageNotes),
    buildMedicalColumn(medical, checklistMap, stageNotes),
    buildInsuranceColumn(insuranceSsf, checklistMap, stageNotes),
    buildCallingVisaColumn(candidate, demand, checklistMap, stageNotes),
    buildVisaColumn(candidate, passport, checklistMap, stageNotes),
    buildFeeColumn(feeTransactions, candidate.serviceFeeAgreed, checklistMap, stageNotes),
    buildFlightColumn(candidate, checklistMap, stageNotes),
    buildDofeColumn(candidate, medical, orientation, insuranceSsf, checklistMap, stageNotes),
    buildDocPrepColumn(candidate, checklistMap, stageNotes),
    buildDepartureColumn(candidate, checklistMap, stageNotes),
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
  getAgentStats,
  exportCandidates,
  getCandidateKanban,
  markColumnComplete,
  toggleChecklistItem,
  resetChecklistColumn,
  getCandidateActivityLogs,
  saveStageNote,

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

    if (
      demand.status === "filled" &&
      demand.filledPositions < demand.totalPositions
    ) {
      await JobDemand.findByIdAndUpdate(demand._id, { status: "active" });
    }

    await Candidate.findByIdAndUpdate(candidateId, {
      $unset: { demandId: 1, assignedDemand: 1 },
    });

    const passportFilter = { agencyId };
    if (candidate.passportId) passportFilter._id = candidate.passportId;
    else if (candidate.passportNumber)
      passportFilter.passportNumber = candidate.passportNumber;
    if (candidate.passportId || candidate.passportNumber) {
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

    const indexLatest = (docs) => {
      const map = new Map();
      for (const d of docs) {
        const key = String(d.candidateId);
        if (!map.has(key)) map.set(key, d);
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
    const allowedKeys = [
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
      "physicalAttributes",
      "workHistory",
    ];

    const updates = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const scoped = scopeFilter(req, {});
    const rawFilter = {
      _id: new mongoose.Types.ObjectId(req.params.id),
      ...(scoped.agencyId
        ? { agencyId: new mongoose.Types.ObjectId(String(scoped.agencyId)) }
        : {}),
    };

    // RAW MongoDB driver write — bypasses Mongoose strict mode for physicalAttributes/workHistory
    const writeResult = await Candidate.collection.updateOne(rawFilter, {
      $set: updates,
    });

    if (writeResult.matchedCount === 0) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const candidate = await Candidate.collection.findOne(rawFilter);

    res.status(200).json({ success: true, candidate });
  }),
};
