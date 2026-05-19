import Candidate from "../models/Candidate.js";
import Passport from "../models/Passport.js";
import Medical from "../models/Medical.js";
import Orientation from "../models/Orientation.js";
import InsuranceSsf from "../models/InsuranceSsf.js";
import JobDemand from "../models/JobDemand.js";
import AgencyDocument from "../models/AgencyDocument.js";
import User from "../models/User.js";
import ManualAlert from "../models/ManualAlert.js";
import asyncHandler from "../utils/asyncHandler.js";
import logger from "../config/logger.js";
import {
  getCachedAlerts,
  setCachedAlerts,
  invalidateAlertCache,
} from "../cache/alertCache.js";

let alertIdCounter = 1;
const generateAlertId = () => `alert_${Date.now()}_${alertIdCounter++}`;

const getAlertsData = async (agencyId) => {
  const alerts = [];
  const today = new Date();

  const daysFromNow = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d;
  };

  const passport180Days = daysFromNow(180); // 6-month passport expiry window
  const dofe60Days      = daysFromNow(60);  // 60-day DoFE license expiry window
  const medical15Days   = daysFromNow(15);
  const demand14Days    = daysFromNow(14);
  const swukriti14Days  = daysFromNow(14);
  const insurance30Days = daysFromNow(30);

  try {
    const passportExpiring = await Passport.aggregate([
      {
        $match: { agencyId, expiryDate: { $lte: passport180Days, $gte: today } },
      },
      {
        $lookup: {
          from: "candidates",
          localField: "candidateId",
          foreignField: "_id",
          as: "candidate",
        },
      },
      { $unwind: "$candidate" },
      { $match: { "candidate.status": { $nin: ["departed", "cancelled"] } } },
      {
        $project: {
          _id: 1,
          "candidate._id": 1,
          "candidate.fullName": 1,
          "candidate.phone": 1,
          expiryDate: 1,
        },
      },
    ]);

    for (const p of passportExpiring) {
      const daysLeft = Math.ceil(
        (new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24),
      );
      const monthsLeft = Math.floor(daysLeft / 30);
      const expiryLabel = daysLeft <= 30
        ? `${daysLeft} day${daysLeft === 1 ? '' : 's'}`
        : `~${monthsLeft} month${monthsLeft === 1 ? '' : 's'}`;
      alerts.push({
        alertId: generateAlertId(),
        type: "passport_expiring",
        severity: daysLeft < 30 ? "critical" : "warning",
        candidateId: p.candidate._id,
        candidateName: p.candidate.fullName,
        candidatePhone: p.candidate.phone,
        message: `Passport expires in ${expiryLabel}`,
        actionUrl: `/candidates/${p.candidate._id}`,
        dueDate: p.expiryDate,
      });
    }

    const medicalExpiring = await Medical.aggregate([
      {
        $match: {
          agencyId,
          result: "fit",
          reportExpiryDate: { $lte: medical15Days, $gte: today },
        },
      },
      {
        $lookup: {
          from: "candidates",
          localField: "candidateId",
          foreignField: "_id",
          as: "candidate",
        },
      },
      { $unwind: "$candidate" },
      { $match: { "candidate.status": { $nin: ["departed", "cancelled"] } } },
      {
        $project: {
          _id: 1,
          "candidate._id": 1,
          "candidate.fullName": 1,
          "candidate.phone": 1,
          reportExpiryDate: 1,
        },
      },
    ]);

    for (const m of medicalExpiring) {
      const daysLeft = Math.ceil(
        (new Date(m.reportExpiryDate) - today) / (1000 * 60 * 60 * 24),
      );
      alerts.push({
        alertId: generateAlertId(),
        type: "medical_expiring",
        severity: daysLeft <= 7 ? "critical" : "warning",
        candidateId: m.candidate._id,
        candidateName: m.candidate.fullName,
        candidatePhone: m.candidate.phone,
        message: `Medical report expires in ${daysLeft} days`,
        actionUrl: `/candidates/${m.candidate._id}`,
        dueDate: m.reportExpiryDate,
      });
    }

    const swukritiExpiring = await JobDemand.aggregate([
      {
        $match: {
          agencyId,
          purbaSwukritiExpiryDate: { $lte: swukriti14Days, $gte: today },
          status: { $ne: "cancelled" },
        },
      },
      {
        $lookup: {
          from: "candidates",
          localField: "assignedCandidates",
          foreignField: "_id",
          as: "candidates",
        },
      },
      { $unwind: "$candidates" },
      {
        $project: {
          employerCompanyName: 1,
          purbaSwukritiExpiryDate: 1,
          "candidates._id": 1,
          "candidates.fullName": 1,
          "candidates.phone": 1,
        },
      },
    ]);

    for (const d of swukritiExpiring) {
      const daysLeft = Math.ceil(
        (new Date(d.purbaSwukritiExpiryDate) - today) / (1000 * 60 * 60 * 24),
      );
      alerts.push({
        alertId: generateAlertId(),
        type: "swukriti_expiring",
        severity: daysLeft < 7 ? "critical" : "warning",
        candidateId: d.candidates._id,
        candidateName: d.candidates.fullName,
        candidatePhone: d.candidates.phone,
        message: `Purba Swukriti expires in ${daysLeft} days for ${d.employerCompanyName}`,
        actionUrl: `/candidates/${d.candidates._id}`,
        dueDate: d.purbaSwukritiExpiryDate,
      });
    }

    const demandExpiring = await JobDemand.aggregate([
      {
        $match: {
          agencyId,
          demandLetterExpiryDate: { $lte: demand14Days, $gte: today },
          status: { $in: ["active", "filled"] },
        },
      },
      {
        $lookup: {
          from: "candidates",
          localField: "assignedCandidates",
          foreignField: "_id",
          as: "candidates",
        },
      },
      { $unwind: "$candidates" },
      {
        $project: {
          employerCompanyName: 1,
          demandLetterExpiryDate: 1,
          "candidates._id": 1,
          "candidates.fullName": 1,
          "candidates.phone": 1,
        },
      },
    ]);

    for (const d of demandExpiring) {
      const daysLeft = Math.ceil(
        (new Date(d.demandLetterExpiryDate) - today) / (1000 * 60 * 60 * 24),
      );
      alerts.push({
        alertId: generateAlertId(),
        type: "demand_expiring",
        severity: daysLeft < 7 ? "critical" : "warning",
        candidateId: d.candidates._id,
        candidateName: d.candidates.fullName,
        candidatePhone: d.candidates.phone,
        message: `Demand expires in ${daysLeft} days for ${d.employerCompanyName}`,
        actionUrl: `/candidates/${d.candidates._id}`,
        dueDate: d.demandLetterExpiryDate,
      });
    }

    const stalled30Days = new Date(today);
    stalled30Days.setDate(stalled30Days.getDate() - 30);

    const stalledCandidates = await Candidate.find({
      agencyId,
      status: {
        $in: [
          "registered",
          "pre_screened",
          "demand_searching",
          "demand_allocated",
          "passport_pending",
          "passport_collected",
          "documents_complete",
          "feims_pending",
          "feims_submitted",
          "feims_registered",
          "medical_scheduled",
          "medical_passed",
          "medical_on_hold",
          "orientation_scheduled",
          "compliance_pending",
          "insurance_done",
          "ssf_done",
          "welfare_done",
          "compliance_complete",
          "visa_applied",
          "visa_stamped",
          "esticker_applied",
          "shram_applied",
          "shram_issued",
          "flight_booked",
          "airport_slot_assigned",
        ],
      },
      updatedAt: { $lte: stalled30Days },
    })
      .select("fullName phone status updatedAt")
      .lean();

    for (const c of stalledCandidates) {
      const daysStalled = Math.ceil(
        (today - new Date(c.updatedAt)) / (1000 * 60 * 60 * 24),
      );
      alerts.push({
        alertId: generateAlertId(),
        type: "process_stalled",
        severity: "info",
        candidateId: c._id,
        candidateName: c.fullName,
        candidatePhone: c.phone,
        message: `No progress in ${daysStalled} days - status: ${c.status}`,
        actionUrl: `/candidates/${c._id}`,
        dueDate: null,
      });
    }

    const medicalFailed = await Candidate.find({
      agencyId,
      status: "medical_failed",
    })
      .select("fullName phone")
      .lean();
    for (const c of medicalFailed) {
      alerts.push({
        alertId: generateAlertId(),
        type: "medical_failed",
        severity: "warning",
        candidateId: c._id,
        candidateName: c.fullName,
        candidatePhone: c.phone,
        message: "Medical failed - needs recheck",
        actionUrl: `/candidates/${c._id}`,
        dueDate: null,
      });
    }

    const departedUnpaid = await Candidate.find({
      agencyId,
      status: "departed",
    })
      .select("fullName phone serviceFeeAgreed serviceFeeReceived")
      .lean();

    for (const c of departedUnpaid) {
      const outstanding =
        (c.serviceFeeAgreed || 0) - (c.serviceFeeReceived || 0);
      if (outstanding > 0) {
        alerts.push({
          alertId: generateAlertId(),
          type: "fee_outstanding",
          severity: "warning",
          candidateId: c._id,
          candidateName: c.fullName,
          candidatePhone: c.phone,
          message: `Outstanding fee: NPR ${outstanding.toLocaleString()}`,
          actionUrl: `/candidates/${c._id}`,
          dueDate: null,
        });
      }
    }

    const medicalPassedNoOrientation = await Candidate.aggregate([
      { $match: { agencyId, status: "medical_passed" } },
      {
        $lookup: {
          from: "orientations",
          localField: "_id",
          foreignField: "candidateId",
          as: "orientation",
        },
      },
      { $match: { orientation: { $size: 0 } } },
      { $project: { _id: 1, fullName: 1, phone: 1 } },
    ]);

    for (const c of medicalPassedNoOrientation) {
      alerts.push({
        alertId: generateAlertId(),
        type: "orientation_missing",
        severity: "info",
        candidateId: c._id,
        candidateName: c.fullName,
        candidatePhone: c.phone,
        message: "Passed medical - needs PDOT orientation",
        actionUrl: `/candidates/${c._id}`,
        dueDate: null,
      });
    }

    const insuranceExpiring = await InsuranceSsf.aggregate([
      {
        $match: {
          agencyId,
          insuranceExpiryDate: { $lte: insurance30Days, $gte: today },
        },
      },
      {
        $lookup: {
          from: "candidates",
          localField: "candidateId",
          foreignField: "_id",
          as: "candidate",
        },
      },
      { $unwind: "$candidate" },
      { $match: { "candidate.status": "departed" } },
      {
        $project: {
          _id: 1,
          "candidate._id": 1,
          "candidate.fullName": 1,
          "candidate.phone": 1,
          insuranceExpiryDate: 1,
        },
      },
    ]);

    for (const i of insuranceExpiring) {
      const daysLeft = Math.ceil(
        (new Date(i.insuranceExpiryDate) - today) / (1000 * 60 * 60 * 24),
      );
      alerts.push({
        alertId: generateAlertId(),
        type: "insurance_expiring",
        severity: "warning",
        candidateId: i.candidate._id,
        candidateName: i.candidate.fullName,
        candidatePhone: i.candidate.phone,
        message: `Insurance expires in ${daysLeft} days (departed)`,
        actionUrl: `/candidates/${i.candidate._id}`,
        dueDate: i.insuranceExpiryDate,
      });
    }

    const dofeLicenseExpiring = await AgencyDocument.aggregate([
      {
        $match: {
          agencyId,
          category: "license",
          expiryDate: { $lte: dofe60Days, $gte: today },
        },
      },
      { $project: { _id: 1, title: 1, expiryDate: 1, expiryAlertDays: 1 } },
    ]);

    for (const doc of dofeLicenseExpiring) {
      const daysLeft = Math.ceil(
        (new Date(doc.expiryDate) - today) / (1000 * 60 * 60 * 24),
      );
      alerts.push({
        alertId: generateAlertId(),
        type: "dofe_license_expiring",
        severity: daysLeft < 30 ? "critical" : "warning",
        candidateId: null,
        candidateName: null,
        candidatePhone: null,
        message: `DoFE License "${doc.title}" expires in ${daysLeft} days`,
        actionUrl: "/documents",
        dueDate: doc.expiryDate,
      });
    }

    alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return 0;
    });

    return { alerts, total: alerts.length };
  } catch (error) {
    logger.error("Alert generation error:", error);
    return { alerts: [], total: 0 };
  }
};

const getAlertsDataCached = async (agencyId) => {
  const cached = getCachedAlerts(agencyId);
  if (cached) return cached;
  const fresh = await getAlertsData(agencyId);
  setCachedAlerts(agencyId, fresh);
  return fresh;
};

const getManualAlertsForUser = async (agencyId, userId, userRole) => {
  const query = {
    agencyId,
    $or: [
      { targetRoles: "all" },
      { targetRoles: userRole },
      { targetUserIds: userId },
    ],
  };
  const manuals = await ManualAlert.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return manuals.map((m) => ({
    alertId: `manual_${m._id}`,
    type: "manual",
    severity: m.severity,
    candidateId: null,
    candidateName: null,
    candidatePhone: null,
    message: m.message,
    actionUrl: m.actionUrl || "/alerts",
    dueDate: null,
    isManual: true,
    manualAlertId: m._id.toString(),
    createdByName: m.createdByName,
    createdAt: m.createdAt,
  }));
};

const getAlerts = asyncHandler(async (req, res) => {
  const { alerts: systemAlerts } = await getAlertsDataCached(req.user.agencyId);
  const manualAlerts = await getManualAlertsForUser(
    req.user.agencyId,
    req.user.userId,
    req.user.role,
  );
  const alerts = [...manualAlerts, ...systemAlerts];
  res.status(200).json({ alerts, total: alerts.length });
});

const getAlertCounts = asyncHandler(async (req, res) => {
  const { alerts: systemAlerts } = await getAlertsDataCached(req.user.agencyId);
  const manualAlerts = await getManualAlertsForUser(
    req.user.agencyId,
    req.user.userId,
    req.user.role,
  );
  const alerts = [...manualAlerts, ...systemAlerts];

  const counts = {
    total: alerts.length,
    critical: 0,
    warning: 0,
    info: 0,
    byType: {},
  };

  alerts.forEach((alert) => {
    counts[alert.severity] = (counts[alert.severity] || 0) + 1;
    counts.byType[alert.type] = (counts.byType[alert.type] || 0) + 1;
  });

  res.status(200).json(counts);
});

const createManualAlert = asyncHandler(async (req, res) => {
  const {
    message,
    severity = "info",
    targetRoles = [],
    targetUsers = [],
    actionUrl,
  } = req.body;

  const creator = await User.findById(req.user.userId).select("name").lean();
  const validSeverity = ["critical", "warning", "info"].includes(severity)
    ? severity
    : "info";

  if (targetRoles.length === 0 && targetUsers.length === 0) {
    return res
      .status(400)
      .json({ message: "Please select at least one target (role or user)" });
  }

  const saved = await ManualAlert.create({
    agencyId: req.user.agencyId,
    message: message.trim(),
    severity: validSeverity,
    targetRoles: targetRoles.length > 0 ? targetRoles : ["all"],
    targetUserIds: targetUsers,
    createdBy: req.user.userId,
    createdByName: creator?.name || "Admin",
    actionUrl: actionUrl || "/alerts",
  });

  invalidateAlertCache(req.user.agencyId);

  res
    .status(201)
    .json({ message: "Alert sent successfully", alertId: saved._id });
});

const deleteManualAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const alert = await ManualAlert.findOne({
    _id: id,
    agencyId: req.user.agencyId,
  });
  if (!alert) return res.status(404).json({ message: "Alert not found" });

  await alert.deleteOne();
  invalidateAlertCache(req.user.agencyId);
  res.status(200).json({ message: "Alert deleted" });
});

export { getAlerts, getAlertCounts, createManualAlert, deleteManualAlert };
