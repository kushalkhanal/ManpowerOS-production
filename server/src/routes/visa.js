import express from "express";
import visaController from "../controllers/visaController.js";
import { authenticate } from "../middleware/authenticate.js";
import {
  filterAgentCandidates,
  checkEditAccess,
  checkDeleteAccess,
} from "../middleware/rbac.js";
import { validateZod } from "../validators/validateZod.js";
import { visaSchema, visaUpdateSchema } from "../validators/zod/visa.schema.js";
import { createDocumentUpload } from "../middleware/upload.js";

const router = express.Router();
const upload = createDocumentUpload("visa");

router.use(authenticate);

router.get("/", filterAgentCandidates, visaController.getVisaApplications);
router.get(
  "/by-candidate",
  filterAgentCandidates,
  visaController.getVisaByCandidate,
);
router.get(
  "/:id",
  filterAgentCandidates,
  visaController.getVisaApplicationById,
);
router.post(
  "/",
  upload.single("visaFile"),
  filterAgentCandidates,
  validateZod(visaSchema),
  visaController.createVisaApplication,
);
router.patch(
  "/:id",
  upload.single("visaFile"),
  filterAgentCandidates,
  checkEditAccess,
  validateZod(visaUpdateSchema),
  visaController.updateVisaApplication,
);
router.delete("/:id", checkDeleteAccess, visaController.deleteVisaApplication);

export default router;
