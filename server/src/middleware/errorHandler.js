import logger from '../config/logger.js';
import AppError from '../utils/AppError.js';

/**
 * Global Express error handler.
 * Mount as the LAST middleware in app.js:
 *   app.use(errorHandler);
 *
 * Handles:
 *   - AppError (operational errors thrown by services/controllers)
 *   - Mongoose ValidationError
 *   - Mongoose duplicate key (11000)
 *   - Mongoose CastError (invalid ObjectId)
 *   - JWT errors
 *   - Multer file errors
 *   - Fallback 500
 */
const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Always log the error with details
  logger.error({
    message: err.message,
    stack: isProduction ? undefined : err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.userId,
    agencyId: req.user?.agencyId,
    userRole: req.user?.role,
    statusCode: err.statusCode || 500,
    errorName: err.name,
    errorCode: err.code
  });

  // Operational error thrown deliberately with AppError
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: []
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const keyValue = err.keyValue || {};
    const fields = Object.keys(keyValue).filter(k => k !== 'agencyId');
    const field = fields[0] || Object.keys(keyValue)[0] || 'field';
    const value = keyValue[field];
    const label = field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase())
      .trim();
    const message = value
      ? `${label} '${value}' already exists`
      : `${label} already exists`;
    return res.status(409).json({
      success: false,
      message,
      errors: [{ field, message }]
    });
  }

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format: ${err.value}`,
      errors: []
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token', errors: [] });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired', errors: [] });
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 10MB',
      errors: []
    });
  }

  // Multer unexpected field
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field in upload',
      errors: []
    });
  }

  // Unknown/programming errors — don't leak details in production
  const statusCode = err.statusCode || 500;
  
  if (statusCode === 500 && isProduction) {
    // Log extra details for 500 errors in production for debugging
    logger.error({
      message: 'Unhandled 500 error details',
      errorType: err.constructor.name,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
    });
  }
  
  return res.status(statusCode).json({
    success: false,
    message: isProduction
      ? 'Internal server error'
      : err.message || 'Internal server error',
    errors: [], // Always include errors array for consistency
    ...(isProduction ? {} : { errorType: err.constructor.name, stack: err.stack })
  });
};

export default errorHandler;
