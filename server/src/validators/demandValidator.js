import { z } from 'zod';

export const createDemandSchema = z.object({
  employerCountry: z.enum([
    'Qatar', 'Saudi Arabia', 'UAE', 'Kuwait', 'Malaysia',
    'Bahrain', 'Oman', 'South Korea', 'Japan', 'Israel',
    'Poland', 'Romania', 'Croatia', 'Other'
  ]),

  employerCompanyName: z.string().min(2).max(200),

  employerContactName: z.string().max(100).optional(),

  employerPhone: z.string().max(30).optional(),

  employerEmail: z.string().email().optional(),

  jobCategory: z.string().min(2).max(100),

  jobDescription: z.string().max(1000).optional(),

  totalPositions: z.number()
    .int('Positions must be a whole number')
    .min(1, 'At least 1 position is required')
    .max(1000),

  salaryFrom: z.number().min(0).optional(),

  salaryTo: z.number().min(0).optional(),

  publishAt: z.coerce.date().optional(),

  expiresAt: z.coerce.date().optional(),

  notes: z.string().max(1000).optional()
})
  .refine(data => {
    if (data.salaryFrom && data.salaryTo && data.salaryTo < data.salaryFrom) {
      return false;
    }
    return true;
  }, {
    message: 'Salary to must be greater than or equal to salary from',
    path: ['salaryTo']
  })
  .refine(data => {
    if (data.expiresAt && data.publishAt && data.expiresAt <= data.publishAt) {
      return false;
    }
    return true;
  }, {
    message: 'Expiry date must be after publish date',
    path: ['expiresAt']
  });

export const updateDemandSchema = createDemandSchema.partial();
