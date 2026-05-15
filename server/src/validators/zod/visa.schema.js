import { z } from 'zod';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const visaBaseSchema = z.object({
  candidateId: mongoId,
  country: z.string().trim().min(1).max(100).optional().nullable(),
  visaType: z.enum(['employment', 'work_permit', 'eps', 'specified_skilled', 'special']).default('employment'),
  embassyName: z.string().trim().max(200).optional().nullable(),
  embassyCity: z.string().trim().max(100).optional().nullable(),
  callingVisaNumber: z.string().trim().max(100).optional().nullable(),
  callingVisaReceivedDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  applicationRef: z.string().trim().max(100).optional().nullable(),
  appointmentDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  submittedDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  status: z.enum([
    'not_started', 'calling_visa_pending', 'appointed', 'submitted', 'stamped', 'rejected', 'cancelled'
  ]).default('not_started'),
  visaNumber: z.string().trim().max(100).optional().nullable(),
  visaIssuedDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  visaExpiryDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  rejectionReason: z.string().trim().max(1000).optional().nullable(),
  rejectionDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  eStickerNumber: z.string().trim().max(100).optional().nullable(),
  eStickerIssuedDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  eStickerExpiryDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable()
});

export const visaSchema = visaBaseSchema.refine(
  data => !(data.status === 'stamped' && !data.visaNumber),
  { message: 'Visa number required when status is stamped', path: ['visaNumber'] }
).refine(
  data => !(data.status === 'rejected' && !data.rejectionReason),
  { message: 'Rejection reason required when status is rejected', path: ['rejectionReason'] }
);

export const visaUpdateSchema = visaBaseSchema.partial().omit({ candidateId: true });
