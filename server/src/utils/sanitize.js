import validator from 'validator';

/**
 * Input Sanitization Utilities
 * Prevents XSS, injection attacks, and malicious input
 */

/**
 * Sanitize string input to prevent XSS attacks
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Escape HTML entities
  let sanitized = validator.escape(str);
  
  // Remove any script tags (after escaping, they'll be &lt;script&gt;)
  sanitized = sanitized.replace(/&lt;script\b[^&]*(?:(?!&lt;\/script&gt;)&[^&]*)*&lt;\/script&gt;/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove on* event handlers (after escaping, like onerror=&quot;)
  sanitized = sanitized.replace(/\bon\w+\s*=\s*(?:&quot;[^&]*&quot;|&#x27;[^&]*&#x27;)/gi, '');
  
  return sanitized.trim();
};

/**
 * Sanitize email input
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return email;
  return validator.normalizeEmail(email.toLowerCase().trim()) || email.toLowerCase().trim();
};

/**
 * Sanitize phone number
 */
export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return phone;
  return phone.replace(/[^\d+\-\s()]/g, '').trim();
};

/**
 * Sanitize URL
 */
export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return url;
  const trimmed = url.trim();
  
  // Check if it's a valid URL
  if (!validator.isURL(trimmed, { protocols: ['http', 'https'], require_protocol: false })) {
    return '';
  }
  
  // Remove javascript: and data: protocols
  if (trimmed.match(/^(javascript|data):/i)) {
    return '';
  }
  
  return trimmed;
};

/**
 * Deep sanitize object - recursively sanitize all string values
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'string') {
        return sanitizeString(item);
      } else if (typeof item === 'object' && item !== null) {
        return sanitizeObject(item);
      }
      return item;
    });
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Middleware to sanitize request body
 */
export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Middleware to sanitize query params
 */
export const sanitizeQuery = (req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
};

/**
 * Middleware to sanitize params
 */
export const sanitizeParams = (req, res, next) => {
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
};

/**
 * Combined sanitization middleware for all request sources
 */
export const sanitizeAll = (req, res, next) => {
  sanitizeBody(req, res, () => {});
  sanitizeQuery(req, res, () => {});
  sanitizeParams(req, res, () => {});
  next();
};

export default {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeAll
};
