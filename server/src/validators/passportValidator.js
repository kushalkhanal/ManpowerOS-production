import { z } from 'zod';

const nepaliPassportNumber = z.string()
  .regex(/^[A-Z]{2}\d{7}$/, 'Passport number must match format: XX1234567 (2 uppercase letters + 7 digits)');

export const createPassportSchema = z.object({
  candidateId: z.string().length(24, 'Invalid candidate ID').optional(),

  passportNumber: nepaliPassportNumber,

  personalNumber: z.string().max(30).optional(),

  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be at most 100 characters')
    .transform(v => v.toUpperCase()),

  dateOfBirth: z.coerce.date({
    errorMap: () => ({ message: 'Invalid date of birth' })
  }),

  issueDate: z.coerce.date({
    errorMap: () => ({ message: 'Invalid issue date' })
  }),

  expiryDate: z.coerce.date({
    errorMap: () => ({ message: 'Invalid expiry date' })
  }),

  gender: z.enum(['male', 'female', 'other']).default('male'),

  issuedDistrict: z.string().max(100).optional(),

  location: z.string().max(200).optional(),

  notes: z.string().max(500).optional(),

  contactPhone: z.string()
    .regex(/^[0-9+\-\s]{7,20}$/, 'Invalid phone number')
    .optional(),

  contactAddress: z.string().max(300).optional(),

  desiredCountry: z.string().optional(),

  scannedImageUrl: z.string().url().optional().or(z.literal(''))
})
  .refine(data => !data.expiryDate || !data.issueDate || data.expiryDate > data.issueDate, {
    message: 'Expiry date must be after issue date',
    path: ['expiryDate']
  })
  .refine(data => !data.issueDate || !data.dateOfBirth || data.issueDate > data.dateOfBirth, {
    message: 'Issue date must be after date of birth',
    path: ['issueDate']
  });

export const updatePassportSchema = createPassportSchema.partial();

export const updatePassportStatusSchema = z.object({
  custodyStatus: z.enum(['with_agency', 'returned_to_candidate', 'submitted_embassy', 'lost']),
  notes: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  sponsorName: z.string().max(100).optional(),
  sponsorNumber: z.string().max(30).optional(),
  assignedStaff: z.string().max(100).optional()
});
