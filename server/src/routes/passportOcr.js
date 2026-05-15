import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { uploadPassportScan } from '../middleware/upload.js';
import passportController from '../controllers/passportController.js';

const router = express.Router();

router.use(authenticate);

router.post('/scan', uploadPassportScan.single('passportImage'), passportController.scanPassport);

export default router;