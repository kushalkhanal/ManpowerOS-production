import { z } from 'zod';

// Phone number validation (Nepal - 10 digits)
const phoneSchema = z.string()
  .trim()
  .regex(/^9\d{9}$/, "Phone number must be exactly 10 digits starting with 9")
  .length(10, "Phone number must be exactly 10 digits");

const nameSchema = z.string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name too long")
  .regex(/^[a-zA-Z\s.'-]+$/, "Name contains invalid characters");

export const staffInviteSchema = z.object({
  name: nameSchema,
  email: z.string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(255, "Email too long"),
  role: z.enum(['admin', 'manager', 'documentation', 'accounts', 'agent', 'superadmin']),
  department: z.string()
    .trim()
    .max(100, "Department name too long")
    .optional()
    .nullable(),
  phone: phoneSchema.optional().nullable()
});

export const staffUpdateSchema = z.object({
  name: nameSchema.optional(),
  role: z.enum(['admin', 'manager', 'documentation', 'accounts', 'agent', 'superadmin']).optional(),
  phone: phoneSchema.optional().nullable(),
  address: z.string()
    .trim()
    .max(500, "Address too long")
    .optional()
    .nullable(),
  photo: z.string()
    .url("Invalid photo URL")
    .max(500, "URL too long")
    .optional()
    .nullable(),
  joiningDate: z.string()
    .or(z.date())
    .transform((val) => val ? new Date(val) : undefined)
    .optional()
    .nullable(),
  salaryNPR: z.number()
    .nonnegative("Salary cannot be negative")
    .max(10000000, "Salary too high")
    .optional()
    .nullable(),
  department: z.string()
    .trim()
    .max(100, "Department name too long")
    .optional()
    .nullable(),
  permissions: z.record(z.boolean()).optional()
});

export const staffPermissionsUpdateSchema = z.object({
  permissions: z.record(z.boolean())
});
