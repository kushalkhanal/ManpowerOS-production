import { v4 as uuidv4 } from "uuid";
import logger from "../config/logger.js";

/**
 * Request ID middleware
 * Generates a unique ID for each request and attaches it to req.id
 * Also injects it into the logger context
 */
export const requestIdMiddleware = (req, res, next) => {
  // Generate unique request ID (use existing header if present from load balancer)
  req.id = req.headers["x-request-id"] || uuidv4();

  // Add request ID to response headers for client tracking
  res.setHeader("X-Request-ID", req.id);

  // Log incoming request with ID
  logger.info(
    {
      requestId: req.id,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    },
    "Incoming request",
  );

  // Track response time
  const startTime = Date.now();

  // Intercept response finish
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.info(
      {
        requestId: req.id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      },
      "Request completed",
    );
  });

  next();
};

export default requestIdMiddleware;
