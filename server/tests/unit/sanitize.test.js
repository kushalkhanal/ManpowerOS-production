import { describe, test, expect } from '@jest/globals';
import {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeObject
} from '../../src/utils/sanitize.js';

describe('Input Sanitization', () => {
  describe('sanitizeString', () => {
    test('should escape HTML entities', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeString(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    test('should remove javascript: protocol', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeString(input);
      expect(result.toLowerCase()).not.toContain('javascript:');
    });

    test('should remove event handlers', () => {
      const input = '<img src="x" onerror="alert(1)">';
      const result = sanitizeString(input);
      // After escaping, onerror becomes onerror=&quot;
      expect(result.toLowerCase()).not.toMatch(/onerror\s*=\s*&quot;/);
    });

    test('should handle normal text', () => {
      const input = 'Hello World 123';
      const result = sanitizeString(input);
      expect(result).toContain('Hello World 123');
    });

    test('should trim whitespace', () => {
      const input = '  test  ';
      const result = sanitizeString(input);
      expect(result).toBe('test');
    });

    test('should handle non-string input', () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
      expect(sanitizeString(undefined)).toBe(undefined);
    });
  });

  describe('sanitizeEmail', () => {
    test('should normalize and lowercase email', () => {
      const input = '  Test@Example.COM  ';
      const result = sanitizeEmail(input);
      expect(result).toBe('test@example.com');
    });

    test('should handle invalid email format gracefully', () => {
      const input = 'notanemail';
      const result = sanitizeEmail(input);
      expect(typeof result).toBe('string');
    });

    test('should handle non-string input', () => {
      expect(sanitizeEmail(123)).toBe(123);
    });
  });

  describe('sanitizePhone', () => {
    test('should keep valid phone characters', () => {
      const input = '+1 (555) 123-4567';
      const result = sanitizePhone(input);
      expect(result).toMatch(/^[\d+\-\s()]+$/);
    });

    test('should remove invalid characters', () => {
      const input = '+1abc(555)def123-4567';
      const result = sanitizePhone(input);
      expect(result).not.toContain('abc');
      expect(result).not.toContain('def');
    });

    test('should handle non-string input', () => {
      expect(sanitizePhone(123)).toBe(123);
    });
  });

  describe('sanitizeUrl', () => {
    test('should accept valid HTTP URL', () => {
      const input = 'http://example.com';
      const result = sanitizeUrl(input);
      expect(result).toBe('http://example.com');
    });

    test('should accept valid HTTPS URL', () => {
      const input = 'https://example.com';
      const result = sanitizeUrl(input);
      expect(result).toBe('https://example.com');
    });

    test('should reject javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeUrl(input);
      expect(result).toBe('');
    });

    test('should reject data: protocol', () => {
      const input = 'data:text/html,<script>alert(1)</script>';
      const result = sanitizeUrl(input);
      expect(result).toBe('');
    });

    test('should handle non-string input', () => {
      expect(sanitizeUrl(123)).toBe(123);
    });
  });

  describe('sanitizeObject', () => {
    test('should sanitize string properties', () => {
      const input = {
        name: '<script>alert(1)</script>',
        email: 'test@example.com'
      };
      const result = sanitizeObject(input);
      expect(result.name).not.toContain('<script>');
      expect(result.email).toBeTruthy();
    });

    test('should handle nested objects', () => {
      const input = {
        user: {
          name: '<script>xss</script>',
          details: {
            bio: 'javascript:alert(1)'
          }
        }
      };
      const result = sanitizeObject(input);
      expect(result.user.name).not.toContain('<script>');
      expect(result.user.details.bio.toLowerCase()).not.toContain('javascript:');
    });

    test('should handle arrays', () => {
      const input = {
        items: ['<script>test</script>', 'normal text']
      };
      const result = sanitizeObject(input);
      // Script tags will be escaped, not removed entirely from arrays
      expect(result.items[0]).not.toMatch(/<script>/);
      expect(result.items[1]).toBe('normal text');
    });

    test('should preserve non-string values', () => {
      const input = {
        count: 42,
        active: true,
        data: null
      };
      const result = sanitizeObject(input);
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
      expect(result.data).toBe(null);
    });

    test('should handle null input', () => {
      expect(sanitizeObject(null)).toBe(null);
      expect(sanitizeObject(undefined)).toBe(undefined);
    });

    test('should handle array input', () => {
      const input = ['<script>test</script>', 'normal'];
      const result = sanitizeObject(input);
      // Script tags will be escaped
      expect(result[0]).not.toMatch(/<script>/);
      expect(result[1]).toBe('normal');
    });
  });
});
