import express from 'express';
import * as staffController from '../controllers/staffController.js';
import { authenticate, authorize } from '../middleware/authenticate.js';
import checkPlanLimits from '../middleware/checkPlanLimits.js';
import { checkStaffAccess } from '../middleware/rbac.js';
import { validateZod } from '../validators/validateZod.js';
import { staffInviteSchema, staffUpdateSchema, staffPermissionsUpdateSchema } from '../validators/zod/staff.schema.js';

const router = express.Router();

router.use(authenticate);

router.get('/', staffController.getUsers);
router.get('/online', staffController.getOnlineUsers);
router.get('/:id', staffController.getUserById);
router.get('/:id/activity', authorize('admin', 'superadmin'), staffController.getUserActivity);
router.get('/:id/candidates', authorize('admin', 'manager'), staffController.getUserCandidates);
router.post('/invite', authorize('admin', 'superadmin'), checkPlanLimits, validateZod(staffInviteSchema), staffController.inviteUser);
router.patch('/:id', authorize('admin', 'superadmin'), validateZod(staffUpdateSchema), staffController.updateUser);
router.patch('/:id/toggle', authorize('admin', 'superadmin'), staffController.toggleUser);
router.patch('/:id/permissions', authorize('admin', 'superadmin'), validateZod(staffPermissionsUpdateSchema), staffController.updatePermissions);
router.post('/:id/reset-password', authorize('admin', 'superadmin'), staffController.resetPassword);
router.delete('/:id', authorize('admin', 'superadmin'), staffController.deleteUser);

export default router;