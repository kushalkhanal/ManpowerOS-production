import express from "express";
import ctrl from "../controllers/countryModulesController.js";
import { authenticate } from "../middleware/authenticate.js";
import { checkEditAccess } from "../middleware/rbac.js";
import { validateZod } from "../validators/validateZod.js";
import {
  gulfVisaUpdateSchema,
  malaysiaPlksUpdateSchema,
} from "../validators/zod/countryModules.schema.js";

const router = express.Router();
router.use(authenticate);

router.get("/gulf/visa-board", ctrl.getGulfVisa);
router.get("/malaysia/plks-board", ctrl.getMalaysiaPlks);
router.patch(
  "/gulf/:candidateId/visa",
  checkEditAccess,
  validateZod(gulfVisaUpdateSchema),
  ctrl.updateGulfVisa,
);
router.patch(
  "/malaysia/:candidateId/plks",
  checkEditAccess,
  validateZod(malaysiaPlksUpdateSchema),
  ctrl.updateMalaysiaPlks,
);

export default router;
