import { z } from 'zod';

export const createOrientationSchema = z.object({
  candidateId: z.string().length(24, 'Invalid candidate ID'),

  trainingCenter: z.string().min(2).max(200).optional(),

  trainingCenterCode: z.string().max(50).optional(),

  batchNumber: z.string().max(50).optional(),

  startDate: z.coerce.date({
    errorMap: () => ({ message: 'Start date is required and must be a valid date' })
  }),

  endDate: z.coerce.date().optional(),

  completionStatus: z.enum(['scheduled', 'completed', 'absent', 'failed']).default('scheduled'),

  certificateNumber: z.string().max(100).optional(),

  certificateIssuedDate: z.coerce.date().optional(),

  feeAmount: z.number().min(0).max(10000).default(700),

  feeReceiptNumber: z.string().max(100).optional(),

  notes: z.string().max(500).optional()
})
  .refine(data => {
    if (data.endDate && data.startDate && data.endDate < data.startDate) {
      return false;
    }
    return true;
  }, {
    message: 'End date must be after start date',
    path: ['endDate']
  })
  .refine(data => {
    if (data.completionStatus === 'completed' && !data.certificateNumber) {
      return false;
    }
    return true;
  }, {
    message: 'Certificate number is required when orientation is marked completed',
    path: ['certificateNumber']
  });

export const updateOrientationSchema = createOrientationSchema.partial().omit({ candidateId: true });
