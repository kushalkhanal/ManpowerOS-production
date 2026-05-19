import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import checkPlanLimits from '../middleware/checkPlanLimits.js';
import { validateZod } from '../validators/validateZod.js';
import { personIntakeSchema } from '../validators/zod/passport.schema.js';
import {
  createPerson,
  searchPersons,
  getPersonProfile
} from '../controllers/personController.js';

const router = express.Router();

router.use(authenticate);

router.post('/', checkPlanLimits, validateZod(personIntakeSchema), createPerson);
router.get('/search', searchPersons);
router.get('/:candidateId', getPersonProfile);

export default router;
