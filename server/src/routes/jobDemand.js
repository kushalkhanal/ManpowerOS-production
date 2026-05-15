import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import jobDemandController from '../controllers/jobDemandController.js';
import { authenticate, authorize } from '../middleware/authenticate.js';
import { filterAgentCandidates, checkEditAccess, checkDeleteAccess } from '../middleware/rbac.js';
import { validateZod } from '../validators/validateZod.js';
import { jobDemandSchema, jobDemandUpdateSchema } from '../validators/zod/jobDemand.schema.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'demands');
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

const fileFilter = (req, file, cb) => {
  const allowedExts = /jpeg|jpg|png|pdf|webp/;
  const allowedMimes = /image\/(jpeg|jpg|png|webp)|application\/pdf/;
  const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimes.test(file.mimetype);
  if (extname && mimetype) cb(null, true);
  else cb(new Error('Only images and PDF allowed'), false);
};

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter });

router.use(authenticate);

router.post('/', upload.fields([
  { name: 'demandLetter', maxCount: 1 },
  { name: 'powerOfAttorney', maxCount: 1 },
  { name: 'embassyAttested', maxCount: 1 }
]), validateZod(jobDemandSchema), jobDemandController.createDemand);

router.get('/', jobDemandController.getDemands);
router.get('/expiring', jobDemandController.getExpiringDemands);
router.get('/:id', jobDemandController.getDemandById);
router.get('/:id/eligible-candidates', jobDemandController.getEligibleCandidates);
router.patch('/:id', upload.fields([
  { name: 'demandLetter', maxCount: 1 },
  { name: 'powerOfAttorney', maxCount: 1 },
  { name: 'embassyAttested', maxCount: 1 }
]), checkEditAccess, validateZod(jobDemandUpdateSchema), jobDemandController.updateDemand);
router.post('/:id/assign', jobDemandController.assignCandidate);
router.delete('/:id/assign/:candidateId', jobDemandController.removeCandidate);
router.delete('/:id', checkDeleteAccess, jobDemandController.deleteDemand);

export default router;