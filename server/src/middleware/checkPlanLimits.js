import Agency from '../models/Agency.js';
import Candidate from '../models/Candidate.js';
import User from '../models/User.js';
import { PLAN_LIMITS } from '../utils/planConfig.js';
import logger from '../config/logger.js';

const checkPlanLimits = async (req, res, next) => {
  try {
    // Superadmin bypasses plan limits
    if (req.user.role === 'superadmin') {
      return next();
    }

    const agency = await Agency.findById(req.user.agencyId);
    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    const limits = PLAN_LIMITS[agency.plan];

    if (req.method === 'POST' && req.path.includes('/invite')) {
      if (limits.users !== null) {
        const userCount = await User.countDocuments({ agencyId: agency._id, isActive: true });
        if (userCount >= limits.users) {
          return res.status(403).json({
            message: `User limit (${limits.users}) reached for ${limits.name} plan`,
            upgrade: true,
            currentPlan: agency.plan,
            limitType: 'users'
          });
        }
      }
    }

    if (req.method === 'POST' && req.path === '/') {
      if (limits.candidates !== null) {
        const candidateCount = await Candidate.countDocuments({ 
          agencyId: agency._id,
          status: { $nin: ['cancelled', 'departed'] }
        });
        if (candidateCount >= limits.candidates) {
          return res.status(403).json({
            message: `Candidate limit (${limits.candidates}) reached for ${limits.name} plan`,
            upgrade: true,
            currentPlan: agency.plan,
            limitType: 'candidates'
          });
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Check plan limits error', { error: error.message });
    res.status(500).json({ message: 'Failed to check plan limits' });
  }
};

export const getPlanUsage = async (agencyId) => {
  const [candidateCount, userCount] = await Promise.all([
    Candidate.countDocuments({ agencyId, status: { $nin: ['cancelled', 'departed'] } }),
    User.countDocuments({ agencyId, isActive: true })
  ]);

  return { candidateCount, userCount };
};

export const checkCanInviteUser = async (agencyId) => {
  const agency = await Agency.findById(agencyId);
  const limits = PLAN_LIMITS[agency.plan];
  const userCount = await User.countDocuments({ agencyId, isActive: true });

  if (limits.users !== null && userCount >= limits.users) {
    return { allowed: false, limit: limits.users, current: userCount };
  }
  return { allowed: true, limit: limits.users, current: userCount };
};

export default checkPlanLimits;