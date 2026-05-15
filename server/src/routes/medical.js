import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import medicalController from '../controllers/medicalController.js';
import { authenticate, authorize } from '../middleware/authenticate.js';
import { filterAgentCandidates, checkEditAccess, checkDeleteAccess  } from '../middleware/rbac.js';
import { validateZod } from '../validators/validateZod.js';
import { medicalSchema, medicalUpdateSchema } from '../validators/zod/medical_orientation.schema.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'medical');
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
  const allowedTypes = /jpeg|jpg|png|pdf|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, webp) and PDF are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

router.use(authenticate);

router.post('/', upload.single('reportFile'), filterAgentCandidates, validateZod(medicalSchema), medicalController.createMedical);
router.get('/board',       filterAgentCandidates, medicalController.getMedicalBoard);
router.patch('/bulk-result', checkEditAccess,     medicalController.bulkUpdateMedicalResult);
router.get('/', filterAgentCandidates, medicalController.getMedicals);
router.get('/:id', filterAgentCandidates, medicalController.getMedicalById);
router.patch('/:id', upload.single('reportFile'), filterAgentCandidates, checkEditAccess, validateZod(medicalUpdateSchema), medicalController.updateMedical);
router.delete('/:id', checkDeleteAccess, medicalController.deleteMedical);

export default router;