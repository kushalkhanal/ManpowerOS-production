import { describe, test, expect } from '@jest/globals';
import {
  sanitizeFilename,
  sanitizePath,
  validateFileExtension,
  validateMimeType,
  generateSafeFilename
} from '../../src/utils/fileSystemSanitize.js';
import path from 'path';

describe('File System Sanitization', () => {
  describe('sanitizeFilename', () => {
    test('should remove path traversal attempts', () => {
      const input = '../../../etc/passwd';
      const result = sanitizeFilename(input);
      expect(result).not.toContain('..');
      expect(result).not.toContain('/');
    });

    test('should remove special characters', () => {
      const input = 'file<>:"|?*.txt';
      const result = sanitizeFilename(input);
      expect(result).toMatch(/^[a-zA-Z0-9._-]+$/);
    });

    test('should keep valid filename', () => {
      const input = 'document-2024_v1.2.pdf';
      const result = sanitizeFilename(input);
      expect(result).toBe('document-2024_v1.2.pdf');
    });

    test('should remove leading dots', () => {
      const input = '...hidden.txt';
      const result = sanitizeFilename(input);
      expect(result).not.toMatch(/^\./);
    });

    test('should generate fallback for empty result', () => {
      const input = '../../';
      const result = sanitizeFilename(input);
      expect(result).toMatch(/^file_\d+$/);
    });

    test('should handle non-string input', () => {
      expect(sanitizeFilename(null)).toBe('');
      expect(sanitizeFilename(undefined)).toBe('');
      expect(sanitizeFilename(123)).toBe('');
    });
  });

  describe('sanitizePath', () => {
    test('should allow valid paths within base directory', () => {
      const baseDir = path.resolve('/var/www/uploads');
      const filePath = 'images/photo.jpg';
      const result = sanitizePath(filePath, baseDir);
      // On Windows, this will be like E:\var\www\uploads\images\photo.jpg
      expect(result).toContain('uploads');
      expect(result).toContain('images');
      expect(result).toContain('photo.jpg');
    });

    test('should throw on path traversal attempts', () => {
      const baseDir = '/var/www/uploads';
      const filePath = '../../etc/passwd';
      expect(() => sanitizePath(filePath, baseDir)).toThrow('Path traversal detected');
    });

    test('should handle absolute paths safely', () => {
      const baseDir = '/var/www/uploads';
      const filePath = '/etc/passwd';
      expect(() => sanitizePath(filePath, baseDir)).toThrow('Path traversal detected');
    });

    test('should handle non-string input', () => {
      const baseDir = '/var/www/uploads';
      expect(sanitizePath(null, baseDir)).toBe('');
      expect(sanitizePath(undefined, baseDir)).toBe('');
    });
  });

  describe('validateFileExtension', () => {
    test('should validate allowed extensions', () => {
      const allowedExtensions = ['.jpg', '.png', '.pdf'];
      expect(validateFileExtension('photo.jpg', allowedExtensions)).toBe(true);
      expect(validateFileExtension('document.pdf', allowedExtensions)).toBe(true);
    });

    test('should reject disallowed extensions', () => {
      const allowedExtensions = ['.jpg', '.png'];
      expect(validateFileExtension('script.exe', allowedExtensions)).toBe(false);
      expect(validateFileExtension('malware.bat', allowedExtensions)).toBe(false);
    });

    test('should be case insensitive', () => {
      const allowedExtensions = ['.jpg'];
      expect(validateFileExtension('photo.JPG', allowedExtensions)).toBe(true);
      expect(validateFileExtension('photo.Jpg', allowedExtensions)).toBe(true);
    });
  });

  describe('validateMimeType', () => {
    test('should validate allowed MIME types', () => {
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      expect(validateMimeType('image/jpeg', allowedTypes)).toBe(true);
      expect(validateMimeType('application/pdf', allowedTypes)).toBe(true);
    });

    test('should reject disallowed MIME types', () => {
      const allowedTypes = ['image/jpeg', 'image/png'];
      expect(validateMimeType('application/exe', allowedTypes)).toBe(false);
      expect(validateMimeType('text/html', allowedTypes)).toBe(false);
    });

    test('should be case insensitive', () => {
      const allowedTypes = ['image/jpeg'];
      expect(validateMimeType('IMAGE/JPEG', allowedTypes)).toBe(true);
      expect(validateMimeType('Image/Jpeg', allowedTypes)).toBe(true);
    });
  });

  describe('generateSafeFilename', () => {
    test('should generate unique filenames', () => {
      const original = 'photo.jpg';
      const result1 = generateSafeFilename(original);
      const result2 = generateSafeFilename(original);
      expect(result1).not.toBe(result2);
    });

    test('should preserve file extension', () => {
      const original = 'document.pdf';
      const result = generateSafeFilename(original);
      expect(result).toMatch(/\.pdf$/);
    });

    test('should contain timestamp and random component', () => {
      const original = 'file.txt';
      const result = generateSafeFilename(original);
      expect(result).toMatch(/^\d+_[a-z0-9]+\.txt$/);
    });
  });
});
