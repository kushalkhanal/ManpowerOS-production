import VisaApplication from "../models/VisaApplication.js";
import Candidate from "../models/Candidate.js";
import asyncHandler from "../utils/asyncHandler.js";
import { computeAndSaveCandidateStatus } from "../services/candidateStatusService.js";
import { scopeFilter, scopeData } from "../utils/tenantHelper.js";
import { logActivity } from "../utils/activityLogger.js";
import { invalidateAlertCache } from "../cache/alertCache.js";

const getVisaApplications = asyncHandler(async (req, res) => {
  const { status, country, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = scopeFilter(req);
  if (status) filter.status = status;
  if (country) filter.country = country;

  const [applications, total] = await Promise.all([
    VisaApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("candidateId", "fullName status desiredCountry passportNumber")
      .lean(),
    VisaApplication.countDocuments(filter),
  ]);

  res.status(200).json({
    data: applications,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

const getVisaApplicationById = asyncHandler(async (req, res) => {
  const app = await VisaApplication.findOne(
    scopeFilter(req, { _id: req.params.id }),
  ).populate("candidateId", "fullName status desiredCountry passportNumber");

  if (!app)
    return res.status(404).json({ message: "Visa application not found" });
  res.status(200).json(app);
});

const getVisaByCandidate = asyncHandler(async (req, res) => {
  const { candidateId } = req.query;
  if (!candidateId)
    return res.status(400).json({ message: "Candidate ID is required" });

  const apps = await VisaApplication.find(scopeFilter(req, { candidateId }))
    .sort({ createdAt: -1 })
    .populate("candidateId", "fullName status desiredCountry passportNumber")
    .lean();

  res.status(200).json(apps);
});

const createVisaApplication = asyncHandler(async (req, res) => {
  const { candidateId } = req.body;
  if (!candidateId)
    return res.status(400).json({ message: "Candidate ID is required" });

  const candidate = await Candidate.findOne(
    scopeFilter(req, { _id: candidateId }),
  );
  if (!candidate)
    return res.status(404).json({ message: "Candidate not found" });

  const data = scopeData(req, { ...req.body });

  // Default country from candidate profile
  if (!data.country && candidate.desiredCountry)
    data.country = candidate.desiredCountry;

  if (req.file) data.visaFileUrl = req.file.path;

  const app = await VisaApplication.create(data);

  await logActivity({
    candidateId: app.candidateId,
    agencyId: req.user.agencyId,
    userId: req.user.userId,
    userName: req.user.name,
    columnId: "visa",
    action: "created",
    details: `Visa application created for ${data.country || "N/A"} — ${data.embassyName || "Embassy TBD"}`,
    referenceId: app._id,
    referenceModel: "VisaApplication",
  });

  await computeAndSaveCandidateStatus(candidateId);
  invalidateAlertCache(req.user.agencyId);

  const populated = await VisaApplication.findById(app._id).populate(
    "candidateId",
    "fullName status desiredCountry passportNumber",
  );
  res.status(201).json(populated);
});

const updateVisaApplication = asyncHandler(async (req, res) => {
  const app = await VisaApplication.findOne(
    scopeFilter(req, { _id: req.params.id }),
  );
  if (!app)
    return res.status(404).json({ message: "Visa application not found" });

  const updates = { ...req.body };
  delete updates.candidateId;
  delete updates.agencyId;

  if (req.file) {
    // Route the file to the correct field based on a query hint or field name
    const fileField =
      req.query.fileType === "esticker" ? "eStickerFileUrl" : "visaFileUrl";
    updates[fileField] = req.file.path;
  }

  const updated = await VisaApplication.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true },
  ).populate("candidateId", "fullName status desiredCountry passportNumber");

  const activityDetails = [];
  if (updates.status) activityDetails.push(`Status: ${updates.status}`);
  if (updates.visaNumber) activityDetails.push(`Visa#: ${updates.visaNumber}`);
  if (updates.eStickerNumber)
    activityDetails.push(`E-Sticker#: ${updates.eStickerNumber}`);
  if (req.file) activityDetails.push("File uploaded");

  if (activityDetails.length > 0) {
    await logActivity({
      candidateId: app.candidateId,
      agencyId: req.user.agencyId,
      userId: req.user.userId,
      userName: req.user.name,
      columnId: "visa",
      action: updates.status ? "status_changed" : "updated",
      details: activityDetails.join(", "),
      previousValue: app.status,
      newValue: updates.status,
      referenceId: app._id,
      referenceModel: "VisaApplication",
    });
  }

  await computeAndSaveCandidateStatus(app.candidateId);
  invalidateAlertCache(req.user.agencyId);

  res.status(200).json(updated);
});

const deleteVisaApplication = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res
      .status(403)
      .json({ message: "Only admin can delete visa applications" });
  }

  const app = await VisaApplication.findOne(
    scopeFilter(req, { _id: req.params.id }),
  );
  if (!app)
    return res.status(404).json({ message: "Visa application not found" });

  const candidateId = app.candidateId;
  await VisaApplication.findByIdAndDelete(req.params.id);
  await computeAndSaveCandidateStatus(candidateId);

  res.status(200).json({ message: "Visa application deleted successfully" });
});

export default {
  getVisaApplications,
  getVisaApplicationById,
  getVisaByCandidate,
  createVisaApplication,
  updateVisaApplication,
  deleteVisaApplication,
};
