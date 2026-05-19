import { z } from 'zod';

export const superAdminAgencyStatusSchema = z.object({
  isActive: z.boolean({
    required_error: "isActive status is required"
  })
});

export const superAdminCreateAdminSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().trim().optional().nullable(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
});

export const superAdminAgencyPlanSchema = z.object({
  plan: z.enum(['trial', 'basic', 'pro'], {
    required_error: "Plan type is required"
  }),
  planExpiresAt: z.string().or(z.date()).transform((val) => val ? new Date(val) : undefined).optional()
});
