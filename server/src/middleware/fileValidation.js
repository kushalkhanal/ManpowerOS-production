import multer from 'multer';
import path from 'path';
import { validateFileExtension, validateMimeType } from '../utils/fileSystemSanitize.js';

/**
 * File upload validation middleware
 * Validates file types, sizes, and prevents malicious uploads
 */

// Allowed file types for different upload categories
export const ALLOWED_IMAGE_TYPES = {
  extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  mimetypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

export const ALLOWED_DOCUMENT_TYPES = {
  extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
  mimetypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
};

export const ALLOWED_ALL_TYPES = {
  extensions: [...ALLOWED_IMAGE_TYPES.extensions, ...ALLOWED_DOCUMENT_TYPES.extensions],
  mimetypes: [...ALLOWED_IMAGE_TYPES.mimetypes, ...ALLOWED_DOCUMENT_TYPES.mimetypes]
};

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  general: 10 * 1024 * 1024 // 10MB
};

/**
 * Validate uploaded file
 */
export const validateFile = (file, allowedTypes, maxSize) => {
  if (!file) {
    return { valid: false, error: 'No file uploaded' };
  }

  // Check file extension
  if (!validateFileExtension(file.originalname, allowedTypes.extensions)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.extensions.join(', ')}`
    };
  }

  // Check MIME type
  if (!validateMimeType(file.mimetype, allowedTypes.mimetypes)) {
    return {
      valid: false,
      error: `Invalid MIME type. File appears to be tampered.`
    };
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }

  return { valid: true };
};

/**
 * Multer file filter for images
 */
export const imageFileFilter = (req, file, cb) => {
  const validation = validateFile(file, ALLOWED_IMAGE_TYPES, FILE_SIZE_LIMITS.image);
  
  if (!validation.valid) {
    return cb(new Error(validation.error), false);
  }
  
  cb(null, true);
};

/**
 * Multer file filter for documents
 */
export const documentFileFilter = (req, file, cb) => {
  const validation = validateFile(file, ALLOWED_DOCUMENT_TYPES, FILE_SIZE_LIMITS.document);
  
  if (!validation.valid) {
    return cb(new Error(validation.error), false);
  }
  
  cb(null, true);
};

/**
 * Multer file filter for all allowed types
 */
export const generalFileFilter = (req, file, cb) => {
  const validation = validateFile(file, ALLOWED_ALL_TYPES, FILE_SIZE_LIMITS.general);
  
  if (!validation.valid) {
    return cb(new Error(validation.error), false);
  }
  
  cb(null, true);
};

/**
 * Handle multer errors
 */
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large',
        error: err.message
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
        error: err.message
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed'
    });
  }
  
  next();
};

export default {
  imageFileFilter,
  documentFileFilter,
  generalFileFilter,
  handleMulterError,
  validateFile,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_ALL_TYPES,
  FILE_SIZE_LIMITS
};
