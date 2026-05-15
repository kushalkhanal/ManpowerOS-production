import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import passportPoolController from '../controllers/passportPoolController.js';
import { validateZod } from '../validators/validateZod.js';
import { passportAllocateSchema, passportDeallocateSchema, passportPoolSearchSchema } from '../validators/zod/passportPool.schema.js';

const router = express.Router();

router.use(authenticate);

router.get('/pool', validateZod(passportPoolSearchSchema, 'query'), passportPoolController.getPoolPassports);
router.get('/pool/allocated', validateZod(passportPoolSearchSchema, 'query'), passportPoolController.getAllocatedPassports);
router.get('/pool/match', passportPoolController.getMatchingPassports);
router.get('/pool/demands', passportPoolController.getActiveDemands);
router.get('/pool/stats', passportPoolController.getPoolStats);
router.post('/pool/allocate', validateZod(passportAllocateSchema), passportPoolController.allocatePassport);
router.post('/pool/deallocate/:passportId', validateZod(passportDeallocateSchema), passportPoolController.deallocatePassport);

export default router;