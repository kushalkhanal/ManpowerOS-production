import express from "express";
import medicalController from "../controllers/medicalController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";
import {
  filterAgentCandidates,
  checkEditAccess,
  checkDeleteAccess,
} from "../middleware/rbac.js";
import { validateZod } from "../validators/validateZod.js";
import {
  medicalSchema,
  medicalUpdateSchema,
} from "../validators/zod/medical_orientation.schema.js";
import { createDocumentUpload } from "../middleware/upload.js";

const router = express.Router();
const upload = createDocumentUpload("medical");

router.use(authenticate);

router.post(
  "/",
  upload.single("reportFile"),
  filterAgentCandidates,
  validateZod(medicalSchema),
  medicalController.createMedical,
);
router.get("/board", filterAgentCandidates, medicalController.getMedicalBoard);
router.patch(
  "/bulk-result",
  checkEditAccess,
  medicalController.bulkUpdateMedicalResult,
);
router.get("/", filterAgentCandidates, medicalController.getMedicals);
router.get("/:id", filterAgentCandidates, medicalController.getMedicalById);
router.patch(
  "/:id",
  upload.single("reportFile"),
  filterAgentCandidates,
  checkEditAccess,
  validateZod(medicalUpdateSchema),
  medicalController.updateMedical,
);
router.delete("/:id", checkDeleteAccess, medicalController.deleteMedical);

export default router;
