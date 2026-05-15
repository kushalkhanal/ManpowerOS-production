import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import tradeTestController from '../controllers/tradeTestController.js';
import { authenticate } from '../middleware/authenticate.js';
import { filterAgentCandidates, checkEditAccess, checkDeleteAccess } from '../middleware/rbac.js';
import { validateZod } from '../validators/validateZod.js';
import { tradeTestSchema, tradeTestUpdateSchema } from '../validators/zod/tradeTest.schema.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'trade-test');
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

router.get('/', filterAgentCandidates, tradeTestController.getTradeTests);
router.get('/by-candidate', filterAgentCandidates, tradeTestController.getTradeTestByCandidate);
router.get('/:id', filterAgentCandidates, tradeTestController.getTradeTestById);
router.post('/', upload.single('certificateFile'), filterAgentCandidates, validateZod(tradeTestSchema), tradeTestController.createTradeTest);
router.patch('/:id', upload.single('certificateFile'), filterAgentCandidates, checkEditAccess, validateZod(tradeTestUpdateSchema), tradeTestController.updateTradeTest);
router.delete('/:id', checkDeleteAccess, tradeTestController.deleteTradeTest);

export default router;
