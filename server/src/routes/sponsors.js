import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/checkPermission.js";
import sponsorController from "../controllers/sponsorController.js";
import { validateZod } from "../validators/validateZod.js";
import {
  sponsorSchema,
  sponsorUpdateSchema,
  sponsorRoleUpdateSchema,
  sponsorPermissionsUpdateSchema,
  sponsorAssignStaffSchema,
  sponsorToggleActiveSchema,
} from "../validators/zod/sponsor.schema.js";

const router = express.Router();

router.use(authenticate);

router.get("/", sponsorController.getSponsors);
router.get("/stats/overview", sponsorController.getSponsorStats);
router.get("/search", sponsorController.searchSponsors);
router.get("/:id", sponsorController.getSponsorById);
router.get("/:id/candidates", sponsorController.getSponsorCandidates);

router.post("/", validateZod(sponsorSchema), sponsorController.createSponsor);

router.patch(
  "/:id",
  validateZod(sponsorUpdateSchema),
  sponsorController.updateSponsor,
);

router.patch(
  "/:id/role",
  requireRole("admin", "manager"),
  validateZod(sponsorRoleUpdateSchema),
  sponsorController.updateRole,
);
router.patch(
  "/:id/permissions",
  requireRole("admin", "manager"),
  validateZod(sponsorPermissionsUpdateSchema),
  sponsorController.updatePermissions,
);
router.patch(
  "/:id/assign-staff",
  requireRole("admin", "manager"),
  validateZod(sponsorAssignStaffSchema),
  sponsorController.assignStaff,
);
router.patch(
  "/:id/toggle-active",
  requireRole("admin", "manager"),
  validateZod(sponsorToggleActiveSchema),
  sponsorController.toggleActive,
);
router.patch(
  "/:id/invite-portal",
  requireRole("admin", "manager"),
  sponsorController.invitePortal,
);

router.delete("/:id", requireRole("admin"), sponsorController.deleteSponsor);

export default router;
