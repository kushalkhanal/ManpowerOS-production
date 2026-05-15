import { z } from 'zod';

export const agencyUpdateSchema = z.object({
  name: z.string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z0-9\s\-&.,()]+$/, "Name contains invalid characters")
    .optional(),
  settings: z.object({
    currency: z.string().trim().max(10).optional(),
    timezone: z.string().trim().max(100).optional(),
    dateFormat: z.string().trim().max(50).optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      whatsapp: z.boolean().optional(),
      system: z.boolean().optional()
    }).optional()
  }).optional(),
  plan: z.enum(['trial', 'basic', 'premium', 'enterprise']).optional(),
  planExpiresAt: z.string()
    .or(z.date())
    .transform((val) => val ? new Date(val) : undefined)
    .optional(),
  isActive: z.boolean().optional()
});

export const agencyLogoUpdateSchema = z.object({
  logo: z.string()
    .url("Invalid logo URL")
    .max(500, "URL too long")
    .optional()
});

export const agencyFeeSchema = z.object({
  fees: z.array(z.object({
    name: z.string().trim().min(1).max(100),
    amount: z.number().min(0).max(1000000),
    description: z.string().trim().max(500).optional()
  })).max(50, "Too many fee items")
});
