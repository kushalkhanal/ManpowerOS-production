import express from 'express';
import superAdminController from '../controllers/superAdminController.js';
import { authenticate, authorize } from '../middleware/authenticate.js';
import { validateZod } from '../validators/validateZod.js';
import {
  superAdminAgencyStatusSchema,
  superAdminCreateAdminSchema,
  superAdminAgencyPlanSchema
} from '../validators/zod/superAdmin.schema.js';
import { sensitiveOperationRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes here require superadmin role
router.use(authenticate);
router.use(authorize('superadmin'));

router.get('/stats', superAdminController.getPlatformStats);
router.get('/agencies', superAdminController.getAllAgencies);
router.patch('/agencies/:id/status', sensitiveOperationRateLimiter, validateZod(superAdminAgencyStatusSchema), superAdminController.updateAgencyStatus);
router.delete('/agencies/:id', sensitiveOperationRateLimiter, superAdminController.deleteAgency);
router.post('/agencies/:id/impersonate', sensitiveOperationRateLimiter, superAdminController.impersonateAgency);
router.post('/agencies/:id/create-admin', sensitiveOperationRateLimiter, validateZod(superAdminCreateAdminSchema), superAdminController.createAdminForAgency);
router.patch('/agencies/:id/plan', sensitiveOperationRateLimiter, validateZod(superAdminAgencyPlanSchema), superAdminController.updateAgencyPlan);

export default router;
