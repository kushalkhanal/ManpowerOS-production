import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Agency from '../models/Agency.js';
import logger from '../config/logger.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET not configured in environment');
    }
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId).populate('agencyId', 'name subdomain plan isActive');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.agencyId?.isActive && user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Agency is inactive' });
    }

    const targetAgencyId = decoded.agencyId || user.agencyId?._id;
    const isImpersonating = !!decoded.agencyId && user.role === 'superadmin';

    // If impersonating, we need the target agency object for metadata
    let targetAgency = user.agencyId;
    if (isImpersonating && !user.agencyId) {
       targetAgency = await Agency.findById(decoded.agencyId);
    }

    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      agencyId: targetAgencyId,
      agencyName: targetAgency?.name,
      agencySubdomain: targetAgency?.subdomain,
      agencyPlan: targetAgency?.plan,
      agencyIsActive: targetAgency ? targetAgency.isActive : true,
      isImpersonating
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error', { error: error.message, stack: error.stack, tokenPrefix: authHeader?.substring(0, 30) });
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

export default authenticate;