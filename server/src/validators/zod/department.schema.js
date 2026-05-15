import { z } from 'zod';

export const departmentSchema = z.object({
  name: z.string().trim().min(2, "Department name must be at least 2 characters").max(50),
  description: z.string().trim().optional().nullable(),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional().default('#6366f1'),
  isActive: z.boolean().optional().default(true),
  order: z.number().int().nonnegative().optional()
});

export const departmentUpdateSchema = departmentSchema.partial();
