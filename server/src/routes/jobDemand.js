import express from "express";
import jobDemandController from "../controllers/jobDemandController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";
import {
  filterAgentCandidates,
  checkEditAccess,
  checkDeleteAccess,
} from "../middleware/rbac.js";
import { validateZod } from "../validators/validateZod.js";
import {
  jobDemandSchema,
  jobDemandUpdateSchema,
} from "../validators/zod/jobDemand.schema.js";
import { createDocumentUpload } from "../middleware/upload.js";

const router = express.Router();
const upload = createDocumentUpload("demands");

router.use(authenticate);

router.post(
  "/",
  upload.fields([
    { name: "demandLetter", maxCount: 1 },
    { name: "powerOfAttorney", maxCount: 1 },
    { name: "embassyAttested", maxCount: 1 },
  ]),
  validateZod(jobDemandSchema),
  jobDemandController.createDemand,
);

router.get("/", jobDemandController.getDemands);
router.get("/expiring", jobDemandController.getExpiringDemands);
router.get("/:id", jobDemandController.getDemandById);
router.get(
  "/:id/eligible-candidates",
  jobDemandController.getEligibleCandidates,
);
router.patch(
  "/:id",
  upload.fields([
    { name: "demandLetter", maxCount: 1 },
    { name: "powerOfAttorney", maxCount: 1 },
    { name: "embassyAttested", maxCount: 1 },
  ]),
  checkEditAccess,
  validateZod(jobDemandUpdateSchema),
  jobDemandController.updateDemand,
);
router.post("/:id/assign", jobDemandController.assignCandidate);
router.delete("/:id/assign/:candidateId", jobDemandController.removeCandidate);
router.delete("/:id", checkDeleteAccess, jobDemandController.deleteDemand);

export default router;
