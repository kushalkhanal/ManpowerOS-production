/**
 * Client-side input validation and sanitization utilities
 * These complement server-side validation for better UX
 */

/**
 * Sanitize user input by removing potentially dangerous characters
 * Note: This is for UX only, server-side validation is still required
 */
export const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  
  // Remove common XSS patterns
  let sanitized = value;
  
  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  return sanitized.trim();
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate Nepal phone number (10 digits starting with 9)
 */
export const isValidNepalPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^9\d{9}$/;
  return phoneRegex.test(phone.trim().replace(/[\s\-()]/g, ''));
};

/**
 * Validate international phone number format
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^[\d+\-\s()]{7,20}$/;
  return phoneRegex.test(phone.trim());
};

/**
 * Format phone number to 10 digits (remove spaces, dashes, etc.)
 */
export const formatNepalPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/[\s\-()]/g, '').trim();
};

/**
 * Validate URL format
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

/**
 * Validate passport number format (uppercase letters and numbers)
 */
export const isValidPassportNumber = (passportNumber) => {
  if (!passportNumber || typeof passportNumber !== 'string') return false;
  const passportRegex = /^[A-Z0-9]{5,20}$/;
  return passportRegex.test(passportNumber.trim());
};

/**
 * Validate password strength
 * Returns object with { isValid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate date is in the past
 */
export const isDateInPast = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date < new Date();
};

/**
 * Validate date is in the future
 */
export const isDateInFuture = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date > new Date();
};

/**
 * Validate date is after another date
 */
export const isDateAfter = (dateString1, dateString2) => {
  if (!dateString1 || !dateString2) return false;
  const date1 = new Date(dateString1);
  const date2 = new Date(dateString2);
  return !isNaN(date1.getTime()) && !isNaN(date2.getTime()) && date1 > date2;
};

/**
 * Validate age from date of birth
 */
export const validateAge = (dateOfBirth, minAge = 18, maxAge = 100) => {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return false;
  
  const age = (new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000);
  return age >= minAge && age <= maxAge;
};

/**
 * Validate passport dates
 * Returns { isValid: boolean, errors: string[] }
 */
export const validatePassportDates = (issueDate, expiryDate, dateOfBirth) => {
  const errors = [];
  
  if (issueDate && expiryDate) {
    if (!isDateAfter(expiryDate, issueDate)) {
      errors.push('Passport expiry date must be after issue date');
    }
    
    // Check if validity exceeds 10 years
    const issue = new Date(issueDate);
    const expiry = new Date(expiryDate);
    const yearsDiff = (expiry - issue) / (365.25 * 24 * 60 * 60 * 1000);
    if (yearsDiff > 10) {
      errors.push('Passport validity cannot exceed 10 years');
    }
  }
  
  if (issueDate && !isDateInPast(issueDate)) {
    errors.push('Passport issue date must be in the past');
  }
  
  if (dateOfBirth && issueDate) {
    if (!isDateAfter(issueDate, dateOfBirth)) {
      errors.push('Date of birth must be before passport issue date');
    }
    
    // Check if person was at least 18 at issue date
    const dob = new Date(dateOfBirth);
    const issue = new Date(issueDate);
    const ageAtIssue = (issue - dob) / (365.25 * 24 * 60 * 60 * 1000);
    if (ageAtIssue < 18) {
      errors.push('Passport holder must be at least 18 years old at issue date');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate required field
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Validate string length
 */
export const validateLength = (value, min = 0, max = Infinity) => {
  if (typeof value !== 'string') return false;
  const length = value.trim().length;
  return length >= min && length <= max;
};

/**
 * Validate number range
 */
export const validateRange = (value, min = -Infinity, max = Infinity) => {
  const num = Number(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
};

/**
 * Validate date format and range
 */
export const isValidDate = (dateString, minDate = null, maxDate = null) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  
  if (minDate && date < new Date(minDate)) return false;
  if (maxDate && date > new Date(maxDate)) return false;
  
  return true;
};

/**
 * Sanitize file name for upload
 */
export const sanitizeFileName = (fileName) => {
  if (!fileName || typeof fileName !== 'string') return '';
  
  // Remove path components
  const nameOnly = fileName.split(/[/\\]/).pop();
  
  // Remove dangerous characters
  return nameOnly.replace(/[^a-zA-Z0-9._-]/g, '_');
};

/**
 * Validate file type
 */
export const isValidFileType = (file, allowedTypes) => {
  if (!file || !file.type) return false;
  return allowedTypes.includes(file.type);
};

/**
 * Validate file size (in bytes)
 */
export const isValidFileSize = (file, maxSize) => {
  if (!file || !file.size) return false;
  return file.size <= maxSize;
};

/**
 * Form validation helper
 * Usage: const errors = validateForm(formData, validationRules);
 */
export const validateForm = (data, rules) => {
  const errors = {};
  
  for (const [field, validators] of Object.entries(rules)) {
    const value = data[field];
    const fieldErrors = [];
    
    for (const validator of validators) {
      const result = validator(value);
      if (result !== true && result !== undefined) {
        fieldErrors.push(typeof result === 'string' ? result : `Invalid ${field}`);
      }
    }
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }
  
  return errors;
};

export default {
  sanitizeInput,
  isValidEmail,
  isValidNepalPhone,
  isValidPhone,
  formatNepalPhone,
  isValidUrl,
  isValidPassportNumber,
  validatePassword,
  isDateInPast,
  isDateInFuture,
  isDateAfter,
  validateAge,
  validatePassportDates,
  isRequired,
  validateLength,
  validateRange,
  isValidDate,
  sanitizeFileName,
  isValidFileType,
  isValidFileSize,
  validateForm
};
