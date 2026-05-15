import { z } from 'zod';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const contractBaseSchema = z.object({
  candidateId: mongoId,
  demandId: mongoId.optional().nullable(),
  sponsorId: mongoId.optional().nullable(),
  contractType: z.enum(['standard', 'dofe_approved']).default('standard'),
  contractLanguage: z.enum(['nepali', 'english', 'arabic', 'other']).default('english'),
  salary: z.number().min(0).optional().nullable(),
  salaryCurrency: z.string().trim().max(10).default('USD'),
  overtimeRatePerHour: z.number().min(0).optional().nullable(),
  workingHoursPerDay: z.number().min(1).max(24).optional().nullable(),
  workingDaysPerWeek: z.number().min(1).max(7).optional().nullable(),
  accommodation: z.enum(['provided', 'allowance', 'self']).default('provided'),
  food: z.enum(['provided', 'allowance', 'self']).default('provided'),
  leavePerYear: z.number().int().min(0).optional().nullable(),
  contractDurationMonths: z.number().int().min(1).optional().nullable(),
  contractStartDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  actualStartDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  contractExpiryDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  renewalDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  status: z.enum(['draft', 'signed', 'active', 'expired', 'terminated', 'renewed']).default('draft'),
  terminationReason: z.string().trim().max(1000).optional().nullable(),
  terminationDate: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  dofeApprovedAt: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
  dofeApprovalNumber: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable()
});

export const contractSchema = contractBaseSchema.refine(
  data => !(data.status === 'terminated' && !data.terminationReason),
  { message: 'Termination reason required when status is terminated', path: ['terminationReason'] }
);

export const contractUpdateSchema = contractBaseSchema.partial().omit({ candidateId: true });
