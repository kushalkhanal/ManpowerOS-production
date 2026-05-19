import User from '../models/User.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import Candidate from '../models/Candidate.js';
import Sponsor from '../models/Sponsor.js';
import { checkCanInviteUser } from '../middleware/checkPlanLimits.js';
import { getDefaultPermissions } from '../middleware/rbac.js';
import asyncHandler from '../utils/asyncHandler.js';
import crypto from 'crypto';
import { sendInviteEmail } from '../services/emailService.js';
import { config } from '../config/env.js';
import logger from '../config/logger.js';

const getUsers = asyncHandler(async (req, res) => {
  const { role, department, isActive, search, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = { agencyId: req.user.agencyId };
  if (role) filter.role = role;
  if (department) filter.department = department;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: new RegExp(escapeRegex(search), 'i') },
      { email: new RegExp(escapeRegex(search), 'i') }
    ];
  }

  const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

  const [users, total] = await Promise.all([
    User.find(filter)
      .select(isAdmin ? '-passwordHash -mfaSecret' : 'name email role phone photo department isActive joiningDate createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(filter)
  ]);

  const userIds = users.map(u => u._id);
  
  const [candidateCounts, sponsorCounts] = await Promise.all([
    Candidate.aggregate([
      { $match: { agentId: { $in: userIds } } },
      { $group: { _id: '$agentId', count: { $sum: 1 } } }
    ]),
    Sponsor.aggregate([
      { $match: { introducedBy: { $in: userIds } } },
      { $group: { _id: '$introducedBy', count: { $sum: 1 } } }
    ])
  ]);

  const candidateCountMap = {};
  candidateCounts.forEach(c => { candidateCountMap[c._id.toString()] = c.count; });

  const sponsorCountMap = {};
  sponsorCounts.forEach(s => { sponsorCountMap[s._id.toString()] = s.count; });

  const usersWithCounts = users.map(u => ({
    ...u,
    candidatesAssigned: candidateCountMap[u._id.toString()] || 0,
    sponsorsIntroduced: sponsorCountMap[u._id.toString()] || 0
  }));

  res.status(200).json({
    data: usersWithCounts,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
});

const getOnlineUsers = asyncHandler(async (req, res) => {
  const connectedUsers = req.app.get('connectedUsers') || new Map();
  const onlineUserIds = Array.from(connectedUsers.keys());
  
  res.status(200).json(onlineUserIds);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId
  }).select('-passwordHash -mfaSecret');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const candidateCount = await Candidate.countDocuments({ agentId: user._id });

  res.status(200).json({ ...user.toObject(), candidateCount });
});

const getUserActivity = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const activities = await import('../models/PassportLog.js').then(m => m.default)
    .find({ userId: req.params.id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  res.status(200).json(activities);
});

const getUserCandidates = asyncHandler(async (req, res) => {
  const candidates = await Candidate.find({ agentId: req.params.id })
    .select('fullName phone status desiredCountry')
    .sort({ registeredAt: -1 })
    .lean();

  res.status(200).json(candidates);
});

const inviteUser = asyncHandler(async (req, res) => {
  const { email, name, role, department, phone } = req.body;

  if (!email || !name || !role) {
    return res.status(400).json({ message: 'Email, name, and role are required' });
  }

  // Only superadmin can create admin accounts; admin can only create staff-level roles
  const allowedRolesForAdmin = ['manager', 'documentation', 'accounts', 'agent'];
  if (req.user.role === 'admin' && !allowedRolesForAdmin.includes(role)) {
    return res.status(403).json({ message: 'Admins can only create staff accounts (manager, documentation, accounts, agent). Contact Super Admin to create an Admin account.' });
  }

  // No one except superadmin can create superadmin accounts via this endpoint
  if (role === 'superadmin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Cannot create a Super Admin account via this endpoint' });
  }

  const canInvite = await checkCanInviteUser(req.user.agencyId);
  if (!canInvite.allowed) {
    return res.status(403).json({
      message: `User limit (${canInvite.limit}) reached`,
      upgrade: true,
      limitType: 'users'
    });
  }

  const existingUser = await User.findOne({
    agencyId: req.user.agencyId,
    email: email.toLowerCase()
  });

  if (existingUser) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const tokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  const placeholderHash = crypto.randomBytes(32).toString('hex');

  const user = await User.create({
    agencyId: req.user.agencyId,
    name,
    email: email.toLowerCase(),
    passwordHash: placeholderHash,
    role,
    department,
    phone,
    isActive: false,
    mustChangePassword: true,
    inviteToken: tokenHash,
    inviteTokenExpires: tokenExpires,
    permissions: getDefaultPermissions(role)
  });

  const clientUrl = config.clientUrl;
  const inviteLink = `${clientUrl}/set-password?token=${rawToken}`;

  sendInviteEmail({
    recipientEmail: email,
    recipientName: name,
    inviteLink,
    agencyName: req.user.agencyName || 'your agency',
  }).catch((err) => logger.warn('[invite] Email delivery failed', { email, error: err.message }));

  res.status(201).json({
    success: true,
    message: 'Invitation created successfully',
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    inviteLink,
    expiresIn: '48 hours'
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const {
    name, role, phone, address, photo,
    joiningDate, salaryNPR, department,
    permissions
  } = req.body;

  const user = await User.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const updates = { name, role, phone, address, photo, joiningDate, salaryNPR, department };
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      if (key === 'role' && updates[key] !== user.role) {
        user.role = updates[key];
        user.permissions = getDefaultPermissions(updates[key]);
      } else {
        user[key] = updates[key];
      }
    }
  });

  if (permissions) {
    user.permissions = { ...user.permissions, ...permissions };
  }

  await user.save();

  res.status(200).json(user.toJSON());
});

const toggleUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user._id.toString() === req.user.userId.toString()) {
    return res.status(400).json({ message: 'Cannot toggle your own account' });
  }

  user.isActive = !user.isActive;
  if (!user.isActive) {
    user.deactivatedAt = new Date();
    user.deactivatedBy = req.user.userId;
  } else {
    user.deactivatedAt = null;
    user.deactivatedBy = null;
  }

  await user.save();

  res.status(200).json({
    message: user.isActive ? 'User activated' : 'User deactivated',
    isActive: user.isActive
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const candidateCount = await Candidate.countDocuments({ agentId: user._id });
  if (candidateCount > 0) {
    return res.status(400).json({
      message: `Cannot delete user with ${candidateCount} assigned candidates`
    });
  }

  await User.findByIdAndDelete(user._id);

  res.status(200).json({ message: 'User deleted' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const placeholderHash = crypto.randomBytes(32).toString('hex');

  user.passwordHash = placeholderHash;
  user.mustChangePassword = true;
  user.inviteToken = tokenHash;
  user.inviteTokenExpires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  await user.save();

  const clientUrl = config.clientUrl;
  const resetLink = `${clientUrl}/set-password?token=${rawToken}`;

  res.status(200).json({
    success: true,
    message: 'Password reset link generated',
    resetLink,
    expiresIn: '2 hours'
  });
});

const updatePermissions = asyncHandler(async (req, res) => {
  const { permissions } = req.body;

  const user = await User.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.permissions = { ...user.permissions, ...permissions };
  await user.save();

  res.status(200).json(user.toJSON());
});

export {
  getUsers,
  getOnlineUsers,
  getUserById,
  getUserActivity,
  getUserCandidates,
  inviteUser,
  updateUser,
  toggleUser,
  deleteUser,
  resetPassword,
  updatePermissions
};