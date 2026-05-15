import express from 'express';
import superAdminController from '../controllers/superAdminController.js';
import { authenticate, authorize } from '../middleware/authenticate.js';
import { validateZod } from '../validators/validateZod.js';
import { 
  superAdminAgencyStatusSchema, 
  superAdminCreateAdminSchema, 
  superAdminAgencyPlanSchema 
} from '../validators/zod/superAdmin.schema.js';

const router = express.Router();

// All routes here require superadmin role
router.use(authenticate);
router.use(authorize('superadmin'));

router.get('/stats', superAdminController.getPlatformStats);
router.get('/agencies', superAdminController.getAllAgencies);
router.patch('/agencies/:id/status', validateZod(superAdminAgencyStatusSchema), superAdminController.updateAgencyStatus);
router.delete('/agencies/:id', superAdminController.deleteAgency);
router.post('/agencies/:id/impersonate', superAdminController.impersonateAgency);
router.post('/agencies/:id/create-admin', validateZod(superAdminCreateAdminSchema), superAdminController.createAdminForAgency);
router.patch('/agencies/:id/plan', validateZod(superAdminAgencyPlanSchema), superAdminController.updateAgencyPlan);

export default router;
