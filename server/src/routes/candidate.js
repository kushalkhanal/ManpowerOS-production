import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import candidateController, * as candidateNamed from '../controllers/candidateController.js';
import { authenticate, authorize } from '../middleware/authenticate.js';
import { filterAgentCandidates, checkEditAccess, checkDeleteAccess } from '../middleware/rbac.js';
import checkPlanLimits from '../middleware/checkPlanLimits.js';
import { validateZod } from '../validators/validateZod.js';
import { candidateSchema, candidateUpdateSchema } from '../validators/zod/candidate.schema.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);

router.get('/', filterAgentCandidates, candidateController.getCandidates);
router.get('/export', filterAgentCandidates, candidateController.exportCandidates);
router.post('/export-batch', authorize('admin', 'manager', 'superadmin'), candidateController.exportBatch);
router.get('/agents', candidateController.getAgents);
router.get('/:id/kanban', filterAgentCandidates, candidateController.getCandidateKanban);
router.get('/:id/activity-logs', filterAgentCandidates, candidateController.getCandidateActivityLogs);
router.patch('/:id/mark-column-complete', filterAgentCandidates, checkEditAccess, candidateController.markColumnComplete);
router.patch('/:id/checklist-item', filterAgentCandidates, checkEditAccess, candidateController.toggleChecklistItem);
router.patch('/:id/checklist-reset', filterAgentCandidates, checkEditAccess, candidateController.resetChecklistColumn);
router.patch('/:id/stage-note', filterAgentCandidates, checkEditAccess, candidateController.saveStageNote);
router.patch('/:id/unassign-from-demand', filterAgentCandidates, checkEditAccess, candidateController.unassignFromDemand);
router.patch('/bulk-status', checkEditAccess, candidateController.bulkUpdateStatus);
router.get('/:id/print-bundle', filterAgentCandidates, candidateController.getPrintBundle);
router.post('/', validateZod(candidateSchema), checkPlanLimits, candidateController.createCandidate);
router.get('/:id', filterAgentCandidates, candidateController.getCandidateById);
router.patch('/:id', upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'visaFile', maxCount: 1 },
  { name: 'feimsFile', maxCount: 1 },
  { name: 'departureFile', maxCount: 1 }
]), filterAgentCandidates, checkEditAccess, validateZod(candidateUpdateSchema), candidateController.updateCandidate);
router.delete('/:id', checkDeleteAccess, candidateController.deleteCandidate);

export default router;