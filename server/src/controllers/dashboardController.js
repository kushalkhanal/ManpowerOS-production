import asyncHandler from '../utils/asyncHandler.js';
import * as apiResponse from '../utils/apiResponse.js';
import { getDashboardOverview } from '../services/pipeline/dashboardOverview.service.js';

const getOverview = asyncHandler(async (req, res) => {
  const result = await getDashboardOverview(req.user.agencyId);
  return apiResponse.success(res, result);
});

export default { getOverview };
