import { z } from 'zod';

export const createMedicalSchema = z.object({
  candidateId: z.string().length(24, 'Invalid candidate ID'),

  medicalType: z.enum(['gamca', 'wafid', 'other']).default('gamca'),

  medicalCenter: z.string().min(2).max(150).optional(),

  medicalCenterLocation: z.string().max(150).optional(),

  scheduledDate: z.coerce.date().optional(),

  conductedDate: z.coerce.date().optional(),

  reportNumber: z.string().max(50).optional(),

  result: z.enum(['pending', 'fit', 'unfit', 'on_hold']).default('pending'),

  reportExpiryDate: z.coerce.date().optional(),

  unfitReason: z.string().max(500).optional(),

  notes: z.string().max(500).optional()
})
  .refine(data => {
    if (data.result === 'unfit' && !data.unfitReason) {
      return false;
    }
    return true;
  }, {
    message: 'Unfit reason is required when result is unfit',
    path: ['unfitReason']
  });

export const updateMedicalSchema = createMedicalSchema.partial().omit({ candidateId: true });
