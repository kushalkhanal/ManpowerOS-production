import express from "express";
import contractController from "../controllers/contractController.js";
import { authenticate } from "../middleware/authenticate.js";
import {
  filterAgentCandidates,
  checkEditAccess,
  checkDeleteAccess,
} from "../middleware/rbac.js";
import { validateZod } from "../validators/validateZod.js";
import {
  contractSchema,
  contractUpdateSchema,
} from "../validators/zod/contract.schema.js";
import { createDocumentUpload } from "../middleware/upload.js";

const router = express.Router();
const upload = createDocumentUpload("contracts");

router.use(authenticate);

router.get("/", filterAgentCandidates, contractController.getContracts);
router.get(
  "/expiring",
  filterAgentCandidates,
  contractController.getExpiringContracts,
);
router.get(
  "/by-candidate",
  filterAgentCandidates,
  contractController.getContractByCandidate,
);
router.get("/:id", filterAgentCandidates, contractController.getContractById);
router.post(
  "/",
  upload.single("contractFile"),
  filterAgentCandidates,
  validateZod(contractSchema),
  contractController.createContract,
);
router.patch(
  "/:id",
  upload.single("contractFile"),
  filterAgentCandidates,
  checkEditAccess,
  validateZod(contractUpdateSchema),
  contractController.updateContract,
);
router.delete("/:id", checkDeleteAccess, contractController.deleteContract);

export default router;
