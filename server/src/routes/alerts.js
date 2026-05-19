import express from "express";
import {
  getAlerts,
  getAlertCounts,
  createManualAlert,
  deleteManualAlert,
} from "../controllers/alertController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/checkPermission.js";
import { validateZod } from "../validators/validateZod.js";
import { manualAlertSchema } from "../validators/zod/alert.schema.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getAlerts);
router.get("/counts", getAlertCounts);
router.post(
  "/",
  requireRole("admin", "manager"),
  validateZod(manualAlertSchema),
  createManualAlert,
);

router.delete("/:id", requireRole("admin"), deleteManualAlert);

export default router;
