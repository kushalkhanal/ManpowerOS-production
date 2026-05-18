import Sponsor from "../models/Sponsor.js";
import Candidate from "../models/Candidate.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { formatBSDisplay } from "../utils/bsDate.js";

const getSponsors = asyncHandler(async (req, res) => {
  const {
    search,
    district,
    province,
    isActive = "true",
    page = 1,
    limit = 20,
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = { agencyId: req.user.agencyId };

  if (isActive !== "all") {
    filter.isActive = isActive === "true";
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { fullName: searchRegex },
      { phone: searchRegex },
      { primaryArea: searchRegex },
    ];
  }

  if (district) {
    filter.coverageDistricts = district;
  }

  if (province) {
    filter.coverageProvinces = province;
  }

  const [sponsors, total] = await Promise.all([
    Sponsor.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("introducedBy", "name")
      .populate("assignedStaffId", "name")
      .lean(),
    Sponsor.countDocuments(filter),
  ]);

  const sponsorIds = sponsors.map((s) => s._id);

  const candidateStats = await Candidate.aggregate([
    { $match: { sponsorId: { $in: sponsorIds } } },
    {
      $group: {
        _id: "$sponsorId",
        totalReferred: { $sum: 1 },
        totalDeparted: {
          $sum: { $cond: [{ $eq: ["$status", "departed"] }, 1, 0] },
        },
      },
    },
  ]);

  const statsMap = candidateStats.reduce((acc, stat) => {
    acc[stat._id.toString()] = {
      candidatesReferred: stat.totalReferred,
      candidatesDeparted: stat.totalDeparted,
    };
    return acc;
  }, {});

  const sponsorsWithStats = sponsors.map((sponsor) => ({
    ...sponsor,
    candidatesReferred:
      statsMap[sponsor._id.toString()]?.candidatesReferred || 0,
    candidatesDeparted:
      statsMap[sponsor._id.toString()]?.candidatesDeparted || 0,
  }));

  res.status(200).json({
    data: sponsorsWithStats,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

const getSponsorById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sponsor = await Sponsor.findOne({
    _id: id,
    agencyId: req.user.agencyId,
  })
    .populate("introducedBy", "name")
    .populate("assignedStaffId", "name")
    .lean();

  if (!sponsor) {
    return res.status(404).json({ message: "Sponsor not found" });
  }

  const [stats, candidates] = await Promise.all([
    Candidate.aggregate([
      { $match: { sponsorId: sponsor._id } },
      {
        $group: {
          _id: null,
          totalReferred: { $sum: 1 },
          totalDeparted: {
            $sum: { $cond: [{ $eq: ["$status", "departed"] }, 1, 0] },
          },
        },
      },
    ]),
    Candidate.find({ sponsorId: id })
      .select("fullName phone status desiredCountry registeredAt departedAt")
      .sort({ registeredAt: -1 })
      .limit(20)
      .lean(),
  ]);

  res.status(200).json({
    ...sponsor,
    candidatesReferred: stats[0]?.totalReferred || 0,
    candidatesDeparted: stats[0]?.totalDeparted || 0,
    candidates: candidates.map((c) => ({
      ...c,
      registeredAtBS: c.registeredAt ? formatBSDisplay(c.registeredAt) : null,
      departedAtBS: c.departedAt ? formatBSDisplay(c.departedAt) : null,
    })),
  });
});

const createSponsor = asyncHandler(async (req, res) => {
  const sponsorData = { ...req.body };
  delete sponsorData.agencyId;
  delete sponsorData.createdAt;
  delete sponsorData.updatedAt;

  const existingSponsor = await Sponsor.findOne({
    agencyId: req.user.agencyId,
    phone: sponsorData.phone,
  });

  if (existingSponsor) {
    return res
      .status(400)
      .json({ message: "Sponsor with this phone number already exists" });
  }

  const sponsor = await Sponsor.create({
    ...sponsorData,
    agencyId: req.user.agencyId,
    introducedBy: req.user.userId,
  });

  const populated = await Sponsor.findById(sponsor._id)
    .populate("introducedBy", "name")
    .populate("assignedStaffId", "name");

  res.status(201).json(populated);
});

const updateSponsor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  delete updates.agencyId;
  delete updates.createdAt;
  delete updates.updatedAt;
  delete updates.introducedBy;

  if (updates.phone) {
    const existingSponsor = await Sponsor.findOne({
      agencyId: req.user.agencyId,
      phone: updates.phone,
      _id: { $ne: id },
    });

    if (existingSponsor) {
      return res.status(400).json({ message: "Phone number already in use" });
    }
  }

  const sponsor = await Sponsor.findOneAndUpdate(
    { _id: id, agencyId: req.user.agencyId },
    updates,
    { new: true },
  )
    .populate("introducedBy", "name")
    .populate("assignedStaffId", "name");

  if (!sponsor) {
    return res.status(404).json({ message: "Sponsor not found" });
  }

  res.status(200).json(sponsor);
});

const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const sponsor = await Sponsor.findOneAndUpdate(
    { _id: id, agencyId: req.user.agencyId },
    { role },
    { new: true },
  )
    .populate("introducedBy", "name")
    .populate("assignedStaffId", "name");

  if (!sponsor) {
    return res.status(404).json({ message: "Sponsor not found" });
  }

  res.status(200).json(sponsor);
});

const updatePermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  const sponsor = await Sponsor.findOneAndUpdate(
    { _id: id, agencyId: req.user.agencyId },
    { permissions },
    { new: true },
  )
    .populate("introducedBy", "name")
    .populate("assignedStaffId", "name");

  if (!sponsor) {
    return res.status(404).json({ message: "Sponsor not found" });
  }

  res.status(200).json(sponsor);
});

const assignStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assignedStaffId } = req.body;

  if (assignedStaffId) {
    const staffExists = await User.findOne({
      _id: assignedStaffId,
      agencyId: req.user.agencyId,
    });
    if (!staffExists) {
      return res.status(404).json({ message: "Staff member not found" });
    }
  }

  const sponsor = await Sponsor.findOneAndUpdate(
    { _id: id, agencyId: req.user.agencyId },
    { assignedStaffId: assignedStaffId || null },
    { new: true },
  )
    .populate("introducedBy", "name")
    .populate("assignedStaffId", "name");

  if (!sponsor) {
    return res.status(404).json({ message: "Sponsor not found" });
  }

  res.status(200).json(sponsor);
});

const invitePortal = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sponsor = await Sponsor.findOneAndUpdate(
    { _id: id, agencyId: req.user.agencyId },
    { portalAccess: true, portalInvitedAt: new Date() },
    { new: true },
  )
    .populate("introducedBy", "name")
    .populate("assignedStaffId", "name");

  if (!sponsor) {
    return res.status(404).json({ message: "Sponsor not found" });
  }

  res.status(200).json(sponsor);
});

const toggleActive = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive, deactivatedReason } = req.body;

  const updateData = { isActive };

  if (isActive === false) {
    updateData.deactivatedAt = new Date();
    updateData.deactivatedReason = deactivatedReason || "";
  } else {
    updateData.deactivatedAt = null;
    updateData.deactivatedReason = null;
  }

  const sponsor = await Sponsor.findOneAndUpdate(
    { _id: id, agencyId: req.user.agencyId },
    updateData,
    { new: true },
  )
    .populate("introducedBy", "name")
    .populate("assignedStaffId", "name");

  if (!sponsor) {
    return res.status(404).json({ message: "Sponsor not found" });
  }

  res.status(200).json(sponsor);
});

const deleteSponsor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const activeCandidates = await Candidate.countDocuments({
    sponsorId: id,
    status: { $nin: ["cancelled", "departed"] },
  });

  if (activeCandidates > 0) {
    return res.status(400).json({
      message:
        "Cannot delete sponsor with active candidates. Deactivate instead.",
    });
  }

  const sponsor = await Sponsor.findOneAndDelete({
    _id: id,
    agencyId: req.user.agencyId,
  });

  if (!sponsor) {
    return res.status(404).json({ message: "Sponsor not found" });
  }

  res.status(200).json({ message: "Sponsor deleted successfully" });
});

const getSponsorCandidates = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const sponsor = await Sponsor.findOne({
    _id: id,
    agencyId: req.user.agencyId,
  });

  if (!sponsor) {
    return res.status(404).json({ message: "Sponsor not found" });
  }

  const [candidates, total] = await Promise.all([
    Candidate.find({ sponsorId: id })
      .select("fullName phone status desiredCountry registeredAt departedAt")
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Candidate.countDocuments({ sponsorId: id }),
  ]);

  const candidatesWithDates = candidates.map((c) => ({
    ...c,
    registeredAtBS: c.registeredAt ? formatBSDisplay(c.registeredAt) : null,
    departedAtBS: c.departedAt ? formatBSDisplay(c.departedAt) : null,
  }));

  res.status(200).json({
    data: candidatesWithDates,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

const getSponsorStats = asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;

  const [totalSponsors, activeSponsors, allStats] = await Promise.all([
    Sponsor.countDocuments({ agencyId }),
    Sponsor.countDocuments({ agencyId, isActive: true }),
    Sponsor.aggregate([
      { $match: { agencyId } },
      {
        $unwind: {
          path: "$coverageDistricts",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $group: { _id: "$coverageDistricts", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const districtStats = allStats
    .filter((s) => s._id)
    .map((s) => ({
      district: s._id,
      count: s.count,
    }));

  const sponsorIds = await Sponsor.find({ agencyId, isActive: true }).distinct(
    "_id",
  );

  let candidateStats = { totalReferred: 0, totalDeparted: 0 };
  if (sponsorIds.length > 0) {
    const stats = await Candidate.aggregate([
      { $match: { sponsorId: { $in: sponsorIds } } },
      {
        $group: {
          _id: null,
          totalReferred: { $sum: 1 },
          totalDeparted: {
            $sum: { $cond: [{ $eq: ["$status", "departed"] }, 1, 0] },
          },
        },
      },
    ]);
    if (stats[0]) {
      candidateStats = stats[0];
    }
  }

  const topSponsors = await Sponsor.find({ agencyId, isActive: true })
    .select("fullName phone")
    .lean();

  const sponsorIdsList = topSponsors.map((s) => s._id);
  const sponsorCandidateStats = await Candidate.aggregate([
    { $match: { sponsorId: { $in: sponsorIdsList } } },
    {
      $group: {
        _id: "$sponsorId",
        referred: { $sum: 1 },
        departed: { $sum: { $cond: [{ $eq: ["$status", "departed"] }, 1, 0] } },
      },
    },
    { $sort: { referred: -1 } },
    { $limit: 5 },
  ]);

  const statsMap = sponsorCandidateStats.reduce((acc, s) => {
    acc[s._id.toString()] = { referred: s.referred, departed: s.departed };
    return acc;
  }, {});

  const topSponsorsWithStats = topSponsors
    .map((s) => ({
      name: s.fullName,
      phone: s.phone,
      referred: statsMap[s._id.toString()]?.referred || 0,
      departed: statsMap[s._id.toString()]?.departed || 0,
    }))
    .sort((a, b) => b.referred - a.referred)
    .slice(0, 5);

  res.status(200).json({
    totalSponsors,
    activeSponsors,
    totalCandidatesReferred: candidateStats.totalReferred,
    topDistricts: districtStats,
    topSponsors: topSponsorsWithStats,
  });
});

const searchSponsors = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(200).json([]);
  }

  const searchRegex = new RegExp(escapeRegex(q), "i");
  const sponsors = await Sponsor.find({
    agencyId: req.user.agencyId,
    isActive: true,
    $or: [{ fullName: searchRegex }, { phone: searchRegex }],
  })
    .select("fullName phone primaryArea coverageDistricts")
    .limit(10)
    .lean();

  res.status(200).json(sponsors);
});

export default {
  getSponsors,
  getSponsorById,
  createSponsor,
  updateSponsor,
  updateRole,
  updatePermissions,
  assignStaff,
  invitePortal,
  toggleActive,
  deleteSponsor,
  getSponsorCandidates,
  getSponsorStats,
  searchSponsors,
};
