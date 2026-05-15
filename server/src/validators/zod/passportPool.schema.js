import { z } from 'zod';

export const passportAllocateSchema = z.object({
  passportId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid passport ID"),
  demandId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid demand ID"),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  agentName: z.string().trim().optional().nullable(),
  agentNumber: z.string().trim().optional().nullable(),
  serviceFeeAgreed: z.number().nonnegative().optional().default(0)
});

export const passportDeallocateSchema = z.object({
  reason: z.string().trim().min(5, "Reason must be at least 5 characters").max(200).optional().nullable()
});

export const passportPoolSearchSchema = z.object({
  gender: z.enum(['male', 'female', 'other']).optional(),
  ageMin: z.coerce.number().int().positive().optional(),
  ageMax: z.coerce.number().int().positive().optional(),
  district: z.string().trim().optional(),
  desiredCountry: z.string().trim().optional(),
  passportValidMonths: z.coerce.number().int().nonnegative().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(20)
});
