import Agency from '../models/Agency.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as apiResponse from '../utils/apiResponse.js';

const getAgency = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id);
  if (!agency) {
    return apiResponse.notFound(res, 'Agency not found');
  }
  return apiResponse.success(res, agency);
});

const updateAgency = asyncHandler(async (req, res) => {
  const {
    name, settings, plan, planExpiresAt, isActive
  } = req.body;

  const update = {};
  if (name) update.name = name;
  if (plan) update.plan = plan;
  if (planExpiresAt) update.planExpiresAt = planExpiresAt;
  if (isActive !== undefined) update.isActive = isActive;
  
  // Use dot notation for nested settings to avoid overwriting the whole object
  if (settings) {
    Object.keys(settings).forEach(key => {
      update[`settings.${key}`] = settings[key];
    });
  }

  const agency = await Agency.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true, runValidators: true }
  );

  if (!agency) {
    return apiResponse.notFound(res, 'Agency not found');
  }

  return apiResponse.success(res, agency, 'Agency updated successfully');
});

const getUsage = asyncHandler(async (req, res) => {
  const { getPlanUsage } = await import('../middleware/checkPlanLimits.js');
  const usage = await getPlanUsage(req.params.id);
  
  // Calculate days remaining if trial
  let daysRemaining = null;
  const agency = await Agency.findById(req.params.id);
  if (agency && agency.plan === 'trial' && agency.trialStartedAt) {
    const expires = new Date(agency.trialStartedAt);
    expires.setDate(expires.getDate() + 14);
    daysRemaining = Math.max(0, Math.ceil((expires - new Date()) / (1000 * 60 * 60 * 24)));
  }

  return apiResponse.success(res, { usage, daysRemaining });
});

export default {
  getAgency,
  updateAgency,
  getUsage
};