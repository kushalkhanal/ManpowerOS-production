import express from "express";
import * as feeController from "../controllers/feeController.js";
import { authenticate } from "../middleware/authenticate.js";
import { checkFinanceAccess } from "../middleware/rbac.js";
import { validateZod } from "../validators/validateZod.js";
import {
  feeTransactionSchema,
  feeTransactionUpdateSchema,
} from "../validators/zod/fee.schema.js";
import { createDocumentUpload } from "../middleware/upload.js";

const router = express.Router();
const upload = createDocumentUpload("fees");

router.use(authenticate);
router.use(checkFinanceAccess);

router.post(
  "/",
  upload.single("receiptFile"),
  validateZod(feeTransactionSchema),
  feeController.createTransaction,
);
router.get("/", feeController.getTransactions);
router.get("/summary", feeController.getSummary);
router.get("/candidate/:candidateId", feeController.getCandidateSummary);
router.get("/:id", feeController.getTransactionById);
router.patch(
  "/:id",
  validateZod(feeTransactionUpdateSchema),
  feeController.updateTransaction,
);
router.delete("/:id", feeController.deleteTransaction);

export default router;
