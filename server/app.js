import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import apiRoutes from "./src/routes/index.js";
import healthRoutes from "./src/routes/health.js";
import errorHandler from "./src/middleware/errorHandler.js";
import requestIdMiddleware from "./src/middleware/requestId.js";
import { sanitizeAll } from "./src/utils/sanitize.js";
import logger from "./src/config/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Trust the first proxy hop (Nginx). Required so req.ip and
// X-Forwarded-For work correctly for rate limiting and logging.
app.set("trust proxy", 1);

logger.info(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);
logger.info(`🔧 CORS_ORIGINS: ${process.env.CORS_ORIGINS}`);
logger.info(`🔧 API_BASE_URL: ${process.env.API_BASE_URL}`);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
        connectSrc: ["'self'", "wss:", "ws:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(",") || [
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(requestIdMiddleware);
app.use(mongoSanitize());
app.use(sanitizeAll); // XSS protection and input sanitization
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve built React files in production
const clientBuildPath = path.join(__dirname, "dist");
app.use(express.static(clientBuildPath));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts, please try again in 15 minutes",
});

app.use("/api", globalLimiter);
// Auth rate limits applied to both the versioned and legacy paths
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/v1/auth/register-agency", authLimiter);
app.use("/api/auth/register-agency", authLimiter);

// Health check (no auth required)
app.use("/", healthRoutes);

// Versioned API — canonical path for all new clients
app.use("/api/v1", apiRoutes);

// Legacy alias — keeps existing frontend and integrations working without changes.
// Can be removed once all clients migrate to /api/v1.
app.use("/api", apiRoutes);

// Handle SPA routing - must be AFTER all API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// Global error handler — must be last middleware
app.use(errorHandler);

export default app;
