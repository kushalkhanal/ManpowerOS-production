import { z } from 'zod';

const nepaliPhone = z.string()
  .regex(/^[0-9+\-\s]{7,20}$/, 'Invalid phone number');

export const createStaffSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100),

  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),

  phone: nepaliPhone.optional(),

  role: z.enum(['admin', 'manager', 'documentation', 'accounts', 'agent'], {
    errorMap: () => ({ message: 'Role must be one of: admin, manager, documentation, accounts, agent' })
  }),

  department: z.enum(['operations', 'documentation', 'accounts', 'field', 'management']).optional(),

  joinedAt: z.coerce.date().optional(),

  address: z.string().max(300).optional(),

  emergencyContact: z.string().max(100).optional(),

  notes: z.string().max(500).optional()
});

export const updateStaffSchema = createStaffSchema.partial().omit({ email: true });

export const updateStaffRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'documentation', 'accounts', 'agent'])
});
