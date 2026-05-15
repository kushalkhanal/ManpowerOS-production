import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();
router.use(authenticate);
router.get('/overview', dashboardController.getOverview);
export default router;
