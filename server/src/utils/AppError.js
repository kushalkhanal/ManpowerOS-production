/**
 * AppError — operational error with HTTP status code.
 * Throw this in controllers/services to send a clean error response.
 *
 * Usage:
 *   throw new AppError('Passport already allocated', 409);
 *   throw new AppError('Plan limit reached', 403);
 */
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
