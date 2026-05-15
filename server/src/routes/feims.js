import express from 'express';
import feimsController from '../controllers/feimsController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateZod } from '../validators/validateZod.js';
import { feimsUpdateSchema, shramSwukritiUpdateSchema } from '../validators/zod/feims.schema.js';
import { checkEditAccess } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);

// ─── Read-only pipeline views ─────────────────────────────────────────────────
router.get('/queue',                         feimsController.getQueue);
router.get('/checklist/:candidateId',        feimsController.getChecklist);
router.get('/packet/:candidateId',           feimsController.getPacket);
router.get('/candidate-status/:candidateId', feimsController.getCandidatePipelineStatus);
router.get('/departure-gate/:candidateId',   feimsController.getDepartureGate);

// ─── Write endpoints (require edit access) ────────────────────────────────────
router.patch('/:candidateId/registration', checkEditAccess, validateZod(feimsUpdateSchema),         feimsController.updateFeimsRegistration);
router.patch('/:candidateId/shram',        checkEditAccess, validateZod(shramSwukritiUpdateSchema), feimsController.updateShramSwukriti);

export default router;
