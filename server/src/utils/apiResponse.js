/**
 * apiResponse — standardised HTTP response helpers.
 * All responses follow the shape: { success, message, data }
 *
 * Usage:
 *   return success(res, candidate);
 *   return created(res, passport, 'Passport added to pool');
 *   return error(res, 'Passport number already exists', 409);
 */

export const success = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

export const created = (res, data, message = 'Created successfully') =>
  res.status(201).json({ success: true, message, data });

export const noContent = (res) =>
  res.status(204).send();

export const error = (res, message = 'An error occurred', statusCode = 400, errors = null) =>
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors })
  });

export const notFound = (res, message = 'Resource not found') =>
  res.status(404).json({ success: false, message });

export const forbidden = (res, message = 'Insufficient permissions') =>
  res.status(403).json({ success: false, message });

export const unauthorized = (res, message = 'Authentication required') =>
  res.status(401).json({ success: false, message });

export default { success, created, noContent, error, notFound, forbidden, unauthorized };
