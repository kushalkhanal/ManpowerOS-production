import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import contractController from '../controllers/contractController.js';
import { authenticate } from '../middleware/authenticate.js';
import { filterAgentCandidates, checkEditAccess, checkDeleteAccess } from '../middleware/rbac.js';
import { validateZod } from '../validators/validateZod.js';
import { contractSchema, contractUpdateSchema } from '../validators/zod/contract.schema.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'contracts');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed'), false);
    }
  }
});

router.use(authenticate);

router.get('/', filterAgentCandidates, contractController.getContracts);
router.get('/expiring', filterAgentCandidates, contractController.getExpiringContracts);
router.get('/by-candidate', filterAgentCandidates, contractController.getContractByCandidate);
router.get('/:id', filterAgentCandidates, contractController.getContractById);
router.post('/', upload.single('contractFile'), filterAgentCandidates, validateZod(contractSchema), contractController.createContract);
router.patch('/:id', upload.single('contractFile'), filterAgentCandidates, checkEditAccess, validateZod(contractUpdateSchema), contractController.updateContract);
router.delete('/:id', checkDeleteAccess, contractController.deleteContract);

export default router;
