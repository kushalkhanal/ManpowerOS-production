import { z } from 'zod';

const optionalDate = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}, z.date().optional());

const optionalText = (max) => z.union([
  z.string().trim().max(max),
  z.literal(''),
  z.null()
]).optional();

// Keep this permissive; only basic length check if provided.
const phoneSchema = z.union([
  z.string()
    .trim()
    .min(7, 'Phone number is too short')
    .max(20, 'Phone number is too long'),
  z.literal(''),
  z.null()
]).optional();

const passportBaseSchema = z.object({
  candidateId: z.string().optional().nullable(),
  agencyId: z.string().optional().nullable(),
  passportNumber: z.string()
    .trim()
    .min(5, "Passport number must be at least 5 characters")
    .max(20, "Passport number too long")
    .regex(/^[A-Z0-9]+$/, "Passport number must contain only uppercase letters and numbers"),
  guardianNumber: optionalText(30),
  fullName: z.union([z.string().trim().max(200), z.literal(''), z.null()]).optional(),
  firstName: z.string().trim().max(50).optional().nullable(),
  lastName: z.string().trim().max(50).optional().nullable(),
  dateOfBirth: optionalDate,
  issueDate: optionalDate,
  expiryDate: optionalDate,
  issuedDistrict: optionalText(100),
  location: optionalText(100),
  scannedImageUrl: optionalText(500),
  gender: z.enum(['male', 'female', 'other']).optional(),
  desiredCountry: optionalText(100),
  contactPhone: phoneSchema,
  contactAddress: optionalText(500),
  notes: optionalText(2000)
});

export const passportSchema = passportBaseSchema
  .superRefine((data, ctx) => {
    // Validate name is provided
    const hasFullName = !!data.fullName?.trim();
    const hasFirstLast = !!data.firstName?.trim() && !!data.lastName?.trim();
    if (!hasFullName && !hasFirstLast) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fullName'],
        message: 'Full name or first and last name is required'
      });
    }

    // Keep only essential date-order validation.
    if (data.issueDate && data.expiryDate) {
      if (data.issueDate >= data.expiryDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['expiryDate'],
          message: 'Passport expiry date must be after issue date'
        });
      }
    }
  })
  .transform((data) => {
    const normalizedFullName = data.fullName?.trim()
      || `${data.firstName?.trim() || ''} ${data.lastName?.trim() || ''}`.trim();

    return {
      ...data,
      fullName: normalizedFullName || undefined
    };
  });

export const passportUpdateSchema = passportBaseSchema.partial();
