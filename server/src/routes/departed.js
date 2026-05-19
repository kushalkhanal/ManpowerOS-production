import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/checkPermission.js";
import { filterAgentCandidates } from "../middleware/rbac.js";
import {
  getDepartedRecords,
  getDepartedStats,
  getDepartedById,
  updateReturnStatus,
  triggerArchive,
  getArchiveStatsHandler,
} from "../controllers/departedController.js";

const router = express.Router();

router.use(authenticate);

router.get("/stats", filterAgentCandidates, getDepartedStats);
router.get("/archive-stats", requireRole("admin", "manager", "superadmin"), getArchiveStatsHandler);
router.post("/archive", requireRole("admin", "superadmin"), triggerArchive);
router.get("/", filterAgentCandidates, getDepartedRecords);
router.get("/:id", filterAgentCandidates, getDepartedById);
router.patch(
  "/:id/return-status",
  requireRole("admin", "manager", "superadmin"),
  updateReturnStatus,
);

export default router;
