import { z } from 'zod';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const tradeTestBaseSchema = z.object({
  candidateId: mongoId,
  tradeCategory: z.string().trim().min(1).max(100).optional().nullable(),
  testCenter: z.string().trim().min(1).max(200).optional().nullable(),
  testCenterCode: z.string().trim().max(50).optional().nullable(),
  testCenterLocation: z.string().trim().max(100).optional().nullable(),
  scheduledDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  conductedDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  result: z.enum(['pending', 'pass', 'fail', 'absent']).default('pending'),
  certificateNumber: z.string().trim().max(100).optional().nullable(),
  ctevtRegistrationNumber: z.string().trim().max(100).optional().nullable(),
  certificateIssuedDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  validityMonths: z.number().int().min(1).max(120).default(24),
  expiryDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  retestScheduledDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  failReason: z.string().trim().max(500).optional().nullable(),
  absentReason: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable()
});

export const tradeTestSchema = tradeTestBaseSchema.refine(
  data => !(data.result === 'pass' && !data.certificateNumber && !data.ctevtRegistrationNumber),
  { message: 'Certificate or CTEVeT registration number required when result is pass', path: ['certificateNumber'] }
);

export const tradeTestUpdateSchema = tradeTestBaseSchema.partial().omit({ candidateId: true });
