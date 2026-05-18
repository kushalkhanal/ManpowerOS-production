import express from "express";
import passportController from "../controllers/passportController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";
import {
  filterAgentCandidates,
  checkEditAccess,
  checkDeleteAccess,
} from "../middleware/rbac.js";
import { validateZod } from "../validators/validateZod.js";
import {
  passportSchema,
  passportUpdateSchema,
} from "../validators/zod/passport.schema.js";
import { sensitiveOperationRateLimiter } from "../middleware/rateLimiter.js";
import { createDocumentUpload } from "../middleware/upload.js";

const router = express.Router();
const upload = createDocumentUpload("passports");

router.use(authenticate);

router.post(
  "/",
  validateZod(passportSchema),
  filterAgentCandidates,
  passportController.createPassport,
);
router.get("/", filterAgentCandidates, passportController.getPassports);
router.get("/expiring", passportController.getExpiringPassports);
router.get("/stats", passportController.getPassportStats);
router.get("/:id", filterAgentCandidates, passportController.getPassportById);
router.patch(
  "/:id",
  validateZod(passportUpdateSchema),
  filterAgentCandidates,
  checkEditAccess,
  passportController.updatePassport,
);
router.patch(
  "/:id/status",
  sensitiveOperationRateLimiter,
  filterAgentCandidates,
  checkEditAccess,
  passportController.updatePassportStatus,
);
router.post(
  "/:id/ensure-candidate",
  filterAgentCandidates,
  passportController.ensureCandidate,
);
router.delete(
  "/:id",
  sensitiveOperationRateLimiter,
  checkDeleteAccess,
  passportController.deletePassport,
);
router.post(
  "/:id/restore",
  sensitiveOperationRateLimiter,
  checkDeleteAccess,
  passportController.restorePassport,
);

export default router;
