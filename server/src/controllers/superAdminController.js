import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Agency from '../models/Agency.js';
import User from '../models/User.js';
import Candidate from '../models/Candidate.js';
import Passport from '../models/Passport.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as apiResponse from '../utils/apiResponse.js';
import { getDefaultPermissions } from '../middleware/rbac.js';
import { config } from '../config/env.js';

/**
 * Get Platform-wide Statistics
 */
export const getPlatformStats = asyncHandler(async (req, res) => {
  const totalAgencies = await Agency.countDocuments();
  const activeAgencies = await Agency.countDocuments({ isActive: true });
  const totalCandidates = await Candidate.countDocuments();
  const totalUsers = await User.countDocuments({ role: { $ne: 'superadmin' } });
  
  // Get Passport Pool Stats
  const poolStats = await Passport.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        allocated: { 
          $sum: { $cond: [{ $ifNull: ["$candidateId", false] }, 1, 0] } 
        }
      }
    }
  ]);


  const stats = {
    agencies: {
      total: totalAgencies,
      active: activeAgencies,
      inactive: totalAgencies - activeAgencies
    },
    candidates: {
      total: totalCandidates
    },
    users: {
      total: totalUsers
    },
    passports: {
      total: poolStats[0]?.total || 0,
      allocated: poolStats[0]?.allocated || 0,
      available: (poolStats[0]?.total || 0) - (poolStats[0]?.allocated || 0)
    }
  };

  return apiResponse.success(res, stats);
});

/**
 * Get all agencies with metadata
 */
export const getAllAgencies = asyncHandler(async (req, res) => {
  const agencies = await Agency.find().sort({ createdAt: -1 });
  
  const enrichedAgencies = await Promise.all(agencies.map(async (agency) => {
    const adminCount = await User.countDocuments({ agencyId: agency._id, role: 'admin' });
    const staffCount = await User.countDocuments({ agencyId: agency._id, role: { $ne: 'admin' } });
    const userCount = adminCount + staffCount;
    const candidateCount = await Candidate.countDocuments({ agencyId: agency._id });
    
    return {
      ...agency.toObject(),
      adminCount,
      staffCount,
      userCount,
      candidateCount
    };
  }));

  return apiResponse.success(res, enrichedAgencies);
});

/**
 * Toggle Agency status (Activate/Deactivate)
 */
export const updateAgencyStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (isActive === undefined) {
    return apiResponse.error(res, 'isActive field is required');
  }

  const agency = await Agency.findByIdAndUpdate(
    id,
    { isActive },
    { new: true }
  );

  if (!agency) {
    return apiResponse.notFound(res, 'Agency not found');
  }

  return apiResponse.success(res, agency, `Agency ${isActive ? 'activated' : 'deactivated'} successfully`);
});

/**
 * Delete Agency (Permanent)
 */
export const deleteAgency = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const agency = await Agency.findByIdAndDelete(id);

  if (!agency) {
    return apiResponse.notFound(res, 'Agency not found');
  }

  // Option: We could also delete orphaned users here, but for safety we'll leave them or handle them later.
  return apiResponse.success(res, null, 'Agency and related data removed successfully');
});

/**
 * Create Admin account for a specific Agency (Super Admin only)
 */
export const createAdminForAgency = asyncHandler(async (req, res) => {
  const { id } = req.params; // agency id
  const { name, email, phone } = req.body;

  if (!name || !email) {
    return apiResponse.error(res, 'Name and email are required');
  }

  const agency = await Agency.findById(id);
  if (!agency) {
    return apiResponse.notFound(res, 'Agency not found');
  }

  // Check if email is already taken in this agency
  const existingUser = await User.findOne({ agencyId: id, email: email.toLowerCase() });
  if (existingUser) {
    return apiResponse.error(res, 'A user with this email already exists in this agency');
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const placeholderHash = crypto.randomBytes(32).toString('hex');

  const admin = await User.create({
    agencyId: id,
    name,
    email: email.toLowerCase(),
    passwordHash: placeholderHash,
    role: 'admin',
    phone: phone || undefined,
    isActive: false,
    mustChangePassword: true,
    inviteToken: tokenHash,
    inviteTokenExpires: new Date(Date.now() + 48 * 60 * 60 * 1000),
    permissions: getDefaultPermissions('admin')
  });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const inviteLink = `${clientUrl}/set-password?token=${rawToken}`;

  return apiResponse.success(res, {
    user: admin.toJSON(),
    inviteLink
  }, `Admin account created for ${agency.name}`);
});

/**
 * Impersonate Agency
 */
export const impersonateAgency = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const agency = await Agency.findById(id);
  if (!agency) {
    return apiResponse.notFound(res, 'Agency not found');
  }

  // Generate a specialized token for impersonation
  const token = jwt.sign({
    userId: req.user.userId,
    role: 'superadmin',
    name: req.user.name,
    agencyId: agency._id, // Override agencyId in token
    impersonated: true
  }, config.jwtSecret, { expiresIn: '2h' });

  return apiResponse.success(res, {
    token,
    user: {
      _id: req.user.userId,
      name: req.user.name,
      role: 'superadmin',
      isImpersonating: true
    },
    agency: {
      _id: agency._id,
      name: agency.name,
      subdomain: agency.subdomain
    }
  }, `Now impersonating ${agency.name}`);
});

/**
 * Update Agency Plan and Expiry (Super Admin only)
 */
export const updateAgencyPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { plan, planExpiresAt } = req.body;

  if (!plan) {
    return apiResponse.error(res, 'Plan type is required');
  }

  // Validate plan type
  const validPlans = ['trial', 'basic', 'pro'];
  if (!validPlans.includes(plan)) {
    return apiResponse.error(res, `Invalid plan type. Must be one of: ${validPlans.join(', ')}`);
  }

  const agency = await Agency.findByIdAndUpdate(
    id,
    { 
      plan, 
      planExpiresAt: planExpiresAt || undefined 
    },
    { new: true }
  );

  if (!agency) {
    return apiResponse.notFound(res, 'Agency not found');
  }

  return apiResponse.success(res, agency, `Agency plan updated to ${plan} successfully`);
});

export default {
  getPlatformStats,
  getAllAgencies,
  updateAgencyStatus,
  deleteAgency,
  impersonateAgency,
  createAdminForAgency,
  updateAgencyPlan
};
