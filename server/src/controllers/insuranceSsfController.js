import InsuranceSsf from "../models/InsuranceSsf.js";
import Candidate from "../models/Candidate.js";
import asyncHandler from "../utils/asyncHandler.js";
import { computeAndSaveCandidateStatus } from "../services/candidateStatusService.js";
import { logActivity } from "../utils/activityLogger.js";
import { invalidateAlertCache } from "../cache/alertCache.js";

const createInsuranceSsf = asyncHandler(async (req, res) => {
  const { candidateId } = req.body;

  if (!candidateId) {
    return res.status(400).json({ message: "Candidate ID is required" });
  }

  const candidate = await Candidate.findOne({
    _id: candidateId,
    agencyId: req.user.agencyId,
  });
  if (!candidate) {
    return res.status(404).json({ message: "Candidate not found" });
  }

  const existingRecord = await InsuranceSsf.findOne({
    agencyId: req.user.agencyId,
    candidateId,
  });

  if (existingRecord) {
    return res.status(400).json({
      message: "Insurance/SSF record already exists for this candidate",
    });
  }

  const recordData = {
    agencyId: req.user.agencyId,
    candidateId,
    ...req.body,
  };

  if (req.files?.insuranceReceipt?.[0]) {
    recordData.insurancePaidReceiptUrl = req.files.insuranceReceipt[0].path;
  }
  if (req.files?.ssfReceipt?.[0]) {
    recordData.ssfReceiptUrl = req.files.ssfReceipt[0].path;
  }

  const record = await InsuranceSsf.create(recordData);

  await logActivity({
    candidateId: record.candidateId,
    agencyId: req.user.agencyId,
    userId: req.user.userId,
    userName: req.user.name,
    columnId: "insurance",
    action: "created",
    details: "Insurance & SSF record created",
    referenceId: record._id,
    referenceModel: "InsuranceSsf",
  });

  await computeAndSaveCandidateStatus(candidateId);
  invalidateAlertCache(req.user.agencyId);

  const populated = await InsuranceSsf.findById(record._id).populate(
    "candidateId",
    "fullName desiredCountry status",
  );

  res.status(201).json(populated);
});

const updateInsuranceSsf = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  delete updates.agencyId;
  delete updates.candidateId;
  delete updates.createdAt;
  delete updates.updatedAt;

  const record = await InsuranceSsf.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId,
  });
  if (!record) {
    return res.status(404).json({ message: "Insurance/SSF record not found" });
  }

  // Handle file uploads
  if (req.files?.insuranceReceipt?.[0]) {
    updates.insurancePaidReceiptUrl = req.files.insuranceReceipt[0].path;
  }
  if (req.files?.ssfReceipt?.[0]) {
    updates.ssfReceiptUrl = req.files.ssfReceipt[0].path;
  }

  // Update fields
  Object.keys(updates).forEach((key) => {
    record[key] = updates[key];
  });

  // Save triggers model pre-save hooks for status calculation
  await record.save();

  // Log activity
  const activityDetails = [];
  if (updates.insurancePolicyNumber)
    activityDetails.push(`Policy#: ${updates.insurancePolicyNumber}`);
  if (updates.ssfRegistrationNumber)
    activityDetails.push(`SSF#: ${updates.ssfRegistrationNumber}`);
  if (req.files?.insuranceReceipt?.[0])
    activityDetails.push("Insurance receipt uploaded");
  if (req.files?.ssfReceipt?.[0]) activityDetails.push("SSF receipt uploaded");

  if (activityDetails.length > 0) {
    await logActivity({
      candidateId: record.candidateId,
      agencyId: req.user.agencyId,
      userId: req.user.userId,
      userName: req.user.name,
      columnId: "insurance",
      action: "updated",
      details: activityDetails.join(", "),
      fileUrl: updates.insurancePaidReceiptUrl || updates.ssfReceiptUrl,
      referenceId: record._id,
      referenceModel: "InsuranceSsf",
    });
  }

  // Recompute central status logic
  await computeAndSaveCandidateStatus(record.candidateId);
  invalidateAlertCache(req.user.agencyId);

  const updated = await InsuranceSsf.findById(req.params.id).populate(
    "candidateId",
    "fullName desiredCountry status",
  );

  res.status(200).json(updated);
});

const getInsuranceSsfByCandidate = asyncHandler(async (req, res) => {
  const { candidateId } = req.query;

  if (!candidateId) {
    return res.status(400).json({ message: "Candidate ID is required" });
  }

  const record = await InsuranceSsf.findOne({
    agencyId: req.user.agencyId,
    candidateId,
  })
    .populate("candidateId", "fullName desiredCountry status")
    .lean();

  res.status(200).json(record || {});
});

const getExpiringInsurance = asyncHandler(async (req, res) => {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiring = await InsuranceSsf.find({
    agencyId: req.user.agencyId,
    insuranceExpiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() },
  })
    .populate({
      path: "candidateId",
      match: { status: "departed" },
      select: "fullName desiredCountry status",
    })
    .lean();

  const filtered = expiring.filter((r) => r.candidateId);

  const enriched = filtered.map((r) => {
    const daysUntilExpiry = Math.ceil(
      (new Date(r.insuranceExpiryDate) - new Date()) / (1000 * 60 * 60 * 24),
    );
    return { ...r, daysUntilExpiry };
  });

  res.status(200).json(enriched);
});

const getIncompleteForFeims = asyncHandler(async (req, res) => {
  const incomplete = await InsuranceSsf.find({
    agencyId: req.user.agencyId,
    overallStatus: { $ne: "completed" },
  })
    .populate("candidateId", "fullName desiredCountry status")
    .lean();

  res.status(200).json(incomplete);
});

const getMissingInsurance = asyncHandler(async (req, res) => {
  const candidates = await Candidate.find({
    agencyId: req.user.agencyId,
    status: { $nin: ["departed", "cancelled"] },
  });

  const candidateIds = candidates.map((c) => c._id);

  const withInsurance = await InsuranceSsf.find({
    agencyId: req.user.agencyId,
    candidateId: { $in: candidateIds },
    insurancePolicyNumber: { $exists: true, $ne: "" },
  }).select("candidateId");

  const withInsuranceIds = withInsurance.map((w) => w.candidateId.toString());

  const missing = candidates.filter(
    (c) => !withInsuranceIds.includes(c._id.toString()),
  );

  res.status(200).json(missing);
});

const deleteInsuranceSsf = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res
      .status(403)
      .json({ message: "Only admin can delete insurance/SSF records" });
  }

  const record = await InsuranceSsf.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId,
  });

  if (!record) {
    return res.status(404).json({ message: "Insurance/SSF record not found" });
  }

  const candidateId = record.candidateId;
  await InsuranceSsf.findByIdAndDelete(req.params.id);

  // Recompute central status logic
  await computeAndSaveCandidateStatus(candidateId);
  invalidateAlertCache(req.user.agencyId);

  res
    .status(200)
    .json({ message: "Insurance/SSF record deleted successfully" });
});

export default {
  createInsuranceSsf,
  updateInsuranceSsf,
  getInsuranceSsfByCandidate,
  getExpiringInsurance,
  getIncompleteForFeims,
  getMissingInsurance,
  deleteInsuranceSsf,
};
