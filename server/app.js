import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './src/routes/auth.js';
import healthRoutes from './src/routes/health.js';
import passportRoutes from './src/routes/passport.js';
import passportOcrRoutes from './src/routes/passportOcr.js';
import passportPoolRoutes from './src/routes/passportPool.js';
import candidateRoutes from './src/routes/candidate.js';
import medicalRoutes from './src/routes/medical.js';
import orientationRoutes from './src/routes/orientation.js';
import insuranceSsfRoutes from './src/routes/insuranceSsf.js';
import jobDemandRoutes from './src/routes/jobDemand.js';
import feeRoutes from './src/routes/fees.js';
import alertRoutes from './src/routes/alerts.js';
import agencyRoutes from './src/routes/agencies.js';
import staffRoutes from './src/routes/staff.js';
import taskRoutes from './src/routes/tasks.js';
import agencyDocRoutes from './src/routes/agencyDocuments.js';
import feimsRoutes from './src/routes/feims.js';
import dashboardRoutes from './src/routes/dashboard.js';
import countryModulesRoutes from './src/routes/countryModules.js';
import tradeTestRoutes from './src/routes/tradeTest.js';
import visaRoutes from './src/routes/visa.js';
import contractRoutes from './src/routes/contract.js';
import sponsorRoutes from './src/routes/sponsors.js';
import sharedDocumentsRoutes from './src/routes/sharedDocuments.js';
import departmentRoutes from './src/routes/departments.js';
import superAdminRoutes from './src/routes/superAdmin.js';
import errorHandler from './src/middleware/errorHandler.js';
import requestIdMiddleware from './src/middleware/requestId.js';
import { sanitizeAll } from './src/utils/sanitize.js';
import logger from './src/config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

logger.info(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);
logger.info(`🔧 CORS_ORIGINS: ${process.env.CORS_ORIGINS}`);
logger.info(`🔧 API_BASE_URL: ${process.env.API_BASE_URL}`);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
      connectSrc: ["'self'", 'wss:', 'ws:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestIdMiddleware);
app.use(mongoSanitize());
app.use(sanitizeAll); // XSS protection and input sanitization
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve built React files in production
const clientBuildPath = path.join(__dirname, 'dist');
app.use(express.static(clientBuildPath));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts, please try again in 15 minutes'
});

app.use('/api', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register-agency', authLimiter);

// Health check routes (no authentication required)
app.use('/', healthRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/passports', passportPoolRoutes);
app.use('/api/passports', passportOcrRoutes);
app.use('/api/passports', passportRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/orientation', orientationRoutes);
app.use('/api/insurance-ssf', insuranceSsfRoutes);
app.use('/api/demands', jobDemandRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/agency-docs', agencyDocRoutes);
app.use('/api/feims', feimsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/country-modules', countryModulesRoutes);
app.use('/api/trade-tests', tradeTestRoutes);
app.use('/api/visa', visaRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/documents', sharedDocumentsRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/superadmin', superAdminRoutes);

// Handle SPA routing - must be AFTER all API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Global error handler — must be last middleware
app.use(errorHandler);

export default app;