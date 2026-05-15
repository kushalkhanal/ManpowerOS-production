import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import passportController from '../controllers/passportController.js';
import { authenticate, authorize } from '../middleware/authenticate.js';
import { filterAgentCandidates, checkEditAccess, checkDeleteAccess } from '../middleware/rbac.js';
import { validateZod } from '../validators/validateZod.js';
import { passportSchema, passportUpdateSchema } from '../validators/zod/passport.schema.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'passports');
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

router.post('/', validateZod(passportSchema), filterAgentCandidates, passportController.createPassport);
router.get('/', filterAgentCandidates, passportController.getPassports);
router.get('/expiring', passportController.getExpiringPassports);
router.get('/stats', passportController.getPassportStats);
router.get('/:id', filterAgentCandidates, passportController.getPassportById);
router.patch('/:id', validateZod(passportUpdateSchema), filterAgentCandidates, checkEditAccess, passportController.updatePassport);
router.patch('/:id/status', passportController.updatePassportStatus);
router.delete('/:id', checkDeleteAccess, passportController.deletePassport);

export default router;