import express from "express";
import candidateController, * as candidateNamed from "../controllers/candidateController.js";
import { markCandidateDeparted } from "../controllers/departedController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/checkPermission.js";
import {
  filterAgentCandidates,
  checkEditAccess,
  checkDeleteAccess,
} from "../middleware/rbac.js";
import checkPlanLimits from "../middleware/checkPlanLimits.js";
import { validateZod } from "../validators/validateZod.js";
import {
  candidateSchema,
  candidateUpdateSchema,
} from "../validators/zod/candidate.schema.js";
import { createDocumentUpload } from "../middleware/upload.js";
import { sensitiveOperationRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();
const upload = createDocumentUpload("documents");

router.use(authenticate);

router.get("/", filterAgentCandidates, candidateController.getCandidates);
router.get(
  "/export",
  filterAgentCandidates,
  candidateController.exportCandidates,
);
router.post(
  "/export-batch",
  sensitiveOperationRateLimiter,
  authorize("admin", "manager", "superadmin"),
  candidateController.exportBatch,
);
router.get("/agents", candidateController.getAgents);
router.get(
  "/:id/kanban",
  filterAgentCandidates,
  candidateController.getCandidateKanban,
);
router.get(
  "/:id/activity-logs",
  filterAgentCandidates,
  candidateController.getCandidateActivityLogs,
);
router.patch(
  "/:id/mark-column-complete",
  filterAgentCandidates,
  checkEditAccess,
  candidateController.markColumnComplete,
);
router.patch(
  "/:id/checklist-item",
  filterAgentCandidates,
  checkEditAccess,
  candidateController.toggleChecklistItem,
);
router.patch(
  "/:id/checklist-reset",
  filterAgentCandidates,
  checkEditAccess,
  candidateController.resetChecklistColumn,
);
router.patch(
  "/:id/stage-note",
  filterAgentCandidates,
  checkEditAccess,
  candidateController.saveStageNote,
);
router.patch(
  "/:id/unassign-from-demand",
  filterAgentCandidates,
  checkEditAccess,
  candidateController.unassignFromDemand,
);
router.post(
  "/:id/depart",
  filterAgentCandidates,
  requireRole("admin", "manager", "superadmin"),
  markCandidateDeparted,
);
router.patch(
  "/bulk-status",
  sensitiveOperationRateLimiter,
  checkEditAccess,
  candidateController.bulkUpdateStatus,
);
router.get(
  "/:id/print-bundle",
  filterAgentCandidates,
  candidateController.getPrintBundle,
);
router.post(
  "/",
  validateZod(candidateSchema),
  checkPlanLimits,
  candidateController.createCandidate,
);
router.get("/:id", filterAgentCandidates, candidateController.getCandidateById);
router.patch(
  "/:id/profile-section",
  filterAgentCandidates,
  checkEditAccess,
  candidateController.updateProfileSection,
);
router.patch(
  "/:id",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "visaFile", maxCount: 1 },
    { name: "feimsFile", maxCount: 1 },
    { name: "departureFile", maxCount: 1 },
  ]),
  filterAgentCandidates,
  checkEditAccess,
  validateZod(candidateUpdateSchema),
  candidateController.updateCandidate,
);
router.delete(
  "/:id",
  sensitiveOperationRateLimiter,
  checkDeleteAccess,
  candidateController.deleteCandidate,
);

export default router;
