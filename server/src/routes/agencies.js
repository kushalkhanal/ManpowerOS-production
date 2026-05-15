import express from 'express';
import agencyController from '../controllers/agencyController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateZod } from '../validators/validateZod.js';
import { agencyUpdateSchema } from '../validators/zod/agency.schema.js';

const router = express.Router();

router.use(authenticate);

router.get('/:id', agencyController.getAgency);
router.patch('/:id', validateZod(agencyUpdateSchema), agencyController.updateAgency);
router.get('/:id/usage', agencyController.getUsage);

export default router;