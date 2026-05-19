import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { uploadPassportScan } from '../middleware/upload.js';
import passportController from '../controllers/passportController.js';
import { ocrRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticate);

router.post('/scan', ocrRateLimiter, uploadPassportScan.single('passportImage'), passportController.scanPassport);

export default router;