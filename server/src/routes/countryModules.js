import express from 'express';
import ctrl from '../controllers/countryModulesController.js';
import { authenticate } from '../middleware/authenticate.js';
import { checkEditAccess } from '../middleware/rbac.js';

const router = express.Router();
router.use(authenticate);

router.get('/gulf/visa-board',         ctrl.getGulfVisa);
router.get('/malaysia/plks-board',     ctrl.getMalaysiaPlks);
router.patch('/gulf/:candidateId/visa',        checkEditAccess, ctrl.updateGulfVisa);
router.patch('/malaysia/:candidateId/plks',    checkEditAccess, ctrl.updateMalaysiaPlks);

export default router;
