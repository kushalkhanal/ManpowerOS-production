/**
 * API router barrel.
 * Imported by app.js and mounted at /api/v1 (canonical) and /api (legacy alias).
 */
import { Router } from "express";

import authRoutes from "./auth.js";
import passportRoutes from "./passport.js";
import passportOcrRoutes from "./passportOcr.js";
import passportPoolRoutes from "./passportPool.js";
import candidateRoutes from "./candidate.js";
import medicalRoutes from "./medical.js";
import orientationRoutes from "./orientation.js";
import insuranceSsfRoutes from "./insuranceSsf.js";
import jobDemandRoutes from "./jobDemand.js";
import feeRoutes from "./fees.js";
import alertRoutes from "./alerts.js";
import agencyRoutes from "./agencies.js";
import staffRoutes from "./staff.js";
import sponsorRoutes from "./sponsors.js";
import taskRoutes from "./tasks.js";
import agencyDocRoutes from "./agencyDocuments.js";
import feimsRoutes from "./feims.js";
import dashboardRoutes from "./dashboard.js";
import countryModulesRoutes from "./countryModules.js";
import tradeTestRoutes from "./tradeTest.js";
import visaRoutes from "./visa.js";
import contractRoutes from "./contract.js";
import sharedDocumentsRoutes from "./sharedDocuments.js";
import departmentRoutes from "./departments.js";
import superAdminRoutes from "./superAdmin.js";
import secureFilesRoutes from "./secureFiles.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/passports", passportPoolRoutes);
router.use("/passports", passportOcrRoutes);
router.use("/passports", passportRoutes);
router.use("/candidates", candidateRoutes);
router.use("/medical", medicalRoutes);
router.use("/orientation", orientationRoutes);
router.use("/insurance-ssf", insuranceSsfRoutes);
router.use("/demands", jobDemandRoutes);
router.use("/fees", feeRoutes);
router.use("/alerts", alertRoutes);
router.use("/agencies", agencyRoutes);
router.use("/staff", staffRoutes);
router.use("/sponsors", sponsorRoutes);
router.use("/tasks", taskRoutes);
router.use("/agency-docs", agencyDocRoutes);
router.use("/feims", feimsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/country-modules", countryModulesRoutes);
router.use("/trade-tests", tradeTestRoutes);
router.use("/visa", visaRoutes);
router.use("/contracts", contractRoutes);
router.use("/documents", sharedDocumentsRoutes);
router.use("/departments", departmentRoutes);
router.use("/superadmin", superAdminRoutes);
router.use("/files", secureFilesRoutes);

export default router;
