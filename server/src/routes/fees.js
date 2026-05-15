import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as feeController from '../controllers/feeController.js';
import { authenticate } from '../middleware/authenticate.js';
import { checkFinanceAccess } from '../middleware/rbac.js';
import { validateZod } from '../validators/validateZod.js';
import { feeTransactionSchema, feeTransactionUpdateSchema } from '../validators/zod/fee.schema.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'receiptFile' ? 'fees' : 'fees';
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

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);
router.use(checkFinanceAccess);

router.post('/', upload.single('receiptFile'), validateZod(feeTransactionSchema), feeController.createTransaction);
router.get('/', feeController.getTransactions);
router.get('/summary', feeController.getSummary);
router.get('/candidate/:candidateId', feeController.getCandidateSummary);
router.get('/:id', feeController.getTransactionById);
router.patch('/:id', validateZod(feeTransactionUpdateSchema), feeController.updateTransaction);
router.delete('/:id', feeController.deleteTransaction);

export default router;