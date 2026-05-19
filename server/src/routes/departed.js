import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/checkPermission.js";
import {
  getDepartedRecords,
  getDepartedStats,
  getDepartedById,
  updateReturnStatus,
} from "../controllers/departedController.js";

const router = express.Router();

router.use(authenticate);

router.get("/stats", getDepartedStats);
router.get("/", getDepartedRecords);
router.get("/:id", getDepartedById);
router.patch(
  "/:id/return-status",
  requireRole("admin", "manager", "superadmin"),
  updateReturnStatus,
);

export default router;
