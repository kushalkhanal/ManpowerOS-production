import { describe, it, expect } from '@jest/globals';
import { passportSchema } from '../../src/validators/zod/passport.schema.js';

describe('passportSchema', () => {
  it('accepts frontend manual-entry payload', () => {
    const parsed = passportSchema.parse({
      passportNumber: 'PA1234567',
      fullName: 'Test User',
      contactPhone: '9800000000',
      issueDate: '2020-01-01',
      expiryDate: '2029-12-31' // 9 years, 364 days - within 10 years
    });

    expect(parsed.fullName).toBe('Test User');
    expect(parsed.issueDate).toBeInstanceOf(Date);
    expect(parsed.expiryDate).toBeInstanceOf(Date);
  });

  it('builds fullName from first and last name', () => {
    const parsed = passportSchema.parse({
      passportNumber: 'PA7654321',
      firstName: 'First',
      lastName: 'Last'
    });

    expect(parsed.fullName).toBe('First Last');
  });

  it('rejects when expiry date is before issue date', () => {
    expect(() => passportSchema.parse({
      passportNumber: 'PA1234567',
      fullName: 'Test User',
      issueDate: '2024-01-01',
      expiryDate: '2023-01-01'
    })).toThrow('Passport expiry date must be after issue date');
  });

  it('accepts passports valid for more than 10 years (cap removed)', () => {
    const parsed = passportSchema.parse({
      passportNumber: 'PA1234567',
      fullName: 'Test User',
      issueDate: '2020-01-01',
      expiryDate: '2030-06-01' // More than 10 years — allowed after schema relaxation
    });

    expect(parsed.fullName).toBe('Test User');
  });

  it('accepts phone numbers that do not start with 9 (rule relaxed)', () => {
    const parsed = passportSchema.parse({
      passportNumber: 'PA1234567',
      fullName: 'Test User',
      contactPhone: '1234567890' // no longer requires leading 9
    });

    expect(parsed.contactPhone).toBe('1234567890');
  });

  it('rejects phone numbers shorter than 7 characters', () => {
    expect(() => passportSchema.parse({
      passportNumber: 'PA1234567',
      fullName: 'Test User',
      contactPhone: '123456' // 6 digits — below minimum
    })).toThrow('Phone number is too short');
  });

  it('rejects phone numbers longer than 20 characters', () => {
    expect(() => passportSchema.parse({
      passportNumber: 'PA1234567',
      fullName: 'Test User',
      contactPhone: '123456789012345678901' // 21 digits — above maximum
    })).toThrow('Phone number is too long');
  });

  it('accepts valid phone numbers of various formats', () => {
    const parsed = passportSchema.parse({
      passportNumber: 'PA1234567',
      fullName: 'Test User',
      contactPhone: '9841234567'
    });

    expect(parsed.contactPhone).toBe('9841234567');
  });
});
