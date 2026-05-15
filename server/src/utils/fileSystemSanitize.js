import path from 'path';

/**
 * File System Sanitization Utilities
 * Prevents path traversal and file system attacks
 */

/**
 * Sanitize filename to prevent path traversal attacks
 * Removes: ../, ./, absolute paths, special characters
 */
export const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  // Get just the basename, removing any path components
  let sanitized = path.basename(filename);

  // Remove any remaining path traversal attempts
  sanitized = sanitized.replace(/\.\./g, '');
  
  // Remove leading dots (hidden files on Unix)
  sanitized = sanitized.replace(/^\.+/, '');

  // Remove or replace dangerous characters
  // Allow: letters, numbers, dash, underscore, dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Ensure it's not empty after sanitization
  if (!sanitized || sanitized === '' || sanitized === '.') {
    sanitized = 'file_' + Date.now();
  }

  return sanitized;
};

/**
 * Sanitize file path to prevent directory traversal
 * Ensures path stays within allowed base directory
 */
export const sanitizePath = (filePath, baseDir) => {
  if (!filePath || typeof filePath !== 'string') {
    return '';
  }

  // Resolve to absolute path
  const resolvedPath = path.resolve(baseDir, filePath);
  const resolvedBase = path.resolve(baseDir);

  // Check if resolved path is within base directory
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('Path traversal detected');
  }

  return resolvedPath;
};

/**
 * Validate file extension against whitelist
 */
export const validateFileExtension = (filename, allowedExtensions) => {
  const ext = path.extname(filename).toLowerCase();
  return allowedExtensions.includes(ext);
};

/**
 * Validate MIME type against whitelist
 */
export const validateMimeType = (mimetype, allowedTypes) => {
  return allowedTypes.includes(mimetype.toLowerCase());
};

/**
 * Generate safe random filename
 */
export const generateSafeFilename = (originalName) => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${random}${ext}`;
};

export default {
  sanitizeFilename,
  sanitizePath,
  validateFileExtension,
  validateMimeType,
  generateSafeFilename
};
