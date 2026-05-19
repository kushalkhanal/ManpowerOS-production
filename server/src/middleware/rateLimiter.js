import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for login attempts
 * Allows 5 attempts per 15 minutes per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

/**
 * Rate limiter for password change/reset
 * Allows 3 attempts per hour per IP
 */
export const passwordChangeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Too many password change attempts. Please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

/**
 * Rate limiter for sensitive operations
 * Allows 10 requests per 15 minutes per IP
 */
export const sensitiveOperationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

/**
 * General API rate limiter
 * Allows 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

/**
 * Per-tenant OCR rate limiter — keyed by agencyId, not IP.
 * Allows 30 passport scans per 10 minutes per agency.
 * Authenticated routes only; falls back to IP if agencyId is missing.
 */
export const ocrRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  keyGenerator: (req) => {
    const agencyId = req.user?.agencyId;
    return agencyId
      ? `ocr:${String(agencyId)}`
      : req.ip;
  },
  message: {
    success: false,
    message: 'OCR scan limit reached (30 per 10 minutes per agency). Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

export default {
  loginRateLimiter,
  passwordChangeRateLimiter,
  sensitiveOperationRateLimiter,
  apiRateLimiter,
  ocrRateLimiter
};
