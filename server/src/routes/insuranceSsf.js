import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import insuranceSsfController from '../controllers/insuranceSsfController.js';
import { authenticate, authorize } from '../middleware/authenticate.js';
import { validateZod } from '../validators/validateZod.js';
import { insuranceSsfSchema, insuranceSsfUpdateSchema } from '../validators/zod/insuranceSsf.schema.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'insuranceReceipt' ? 'insurance' : 'ssf';
    const uploadDir = path.join(process.cwd(), 'uploads', folder);
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
    cb(new Error('Only image files and PDF are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

router.use(authenticate);

router.post('/', upload.fields([{ name: 'insuranceReceipt', maxCount: 1 }, { name: 'ssfReceipt', maxCount: 1 }]), validateZod(insuranceSsfSchema), insuranceSsfController.createInsuranceSsf);
router.patch('/:id', upload.fields([{ name: 'insuranceReceipt', maxCount: 1 }, { name: 'ssfReceipt', maxCount: 1 }]), validateZod(insuranceSsfUpdateSchema), insuranceSsfController.updateInsuranceSsf);
router.get('/', insuranceSsfController.getInsuranceSsfByCandidate);
router.get('/expiring', insuranceSsfController.getExpiringInsurance);
router.get('/incomplete-feims', insuranceSsfController.getIncompleteForFeims);
router.get('/missing-insurance', insuranceSsfController.getMissingInsurance);
router.delete('/:id', authorize('admin', 'superadmin'), insuranceSsfController.deleteInsuranceSsf);

export default router;