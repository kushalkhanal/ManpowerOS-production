import express from "express";
import insuranceSsfController from "../controllers/insuranceSsfController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";
import { validateZod } from "../validators/validateZod.js";
import {
  insuranceSsfSchema,
  insuranceSsfUpdateSchema,
} from "../validators/zod/insuranceSsf.schema.js";
import { createDocumentUpload } from "../middleware/upload.js";

const router = express.Router();

// Route insuranceReceipt → 'insurance' folder, ssfReceipt → 'ssf' folder
const upload = createDocumentUpload((fieldname) =>
  fieldname === "insuranceReceipt" ? "insurance" : "ssf",
);

router.use(authenticate);

router.post(
  "/",
  upload.fields([
    { name: "insuranceReceipt", maxCount: 1 },
    { name: "ssfReceipt", maxCount: 1 },
  ]),
  validateZod(insuranceSsfSchema),
  insuranceSsfController.createInsuranceSsf,
);
router.patch(
  "/:id",
  upload.fields([
    { name: "insuranceReceipt", maxCount: 1 },
    { name: "ssfReceipt", maxCount: 1 },
  ]),
  validateZod(insuranceSsfUpdateSchema),
  insuranceSsfController.updateInsuranceSsf,
);
router.get("/", insuranceSsfController.getInsuranceSsfByCandidate);
router.get("/expiring", insuranceSsfController.getExpiringInsurance);
router.get("/incomplete-feims", insuranceSsfController.getIncompleteForFeims);
router.get("/missing-insurance", insuranceSsfController.getMissingInsurance);
router.delete(
  "/:id",
  authorize("admin", "superadmin"),
  insuranceSsfController.deleteInsuranceSsf,
);

export default router;
