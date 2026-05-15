import { z } from 'zod';

const nepaliPhone = z.string()
  .regex(/^[0-9+\-\s]{7,20}$/, 'Invalid phone number');

export const createSponsorSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100),

  company: z.string().max(150).optional(),

  // At least one contact is required
  phone: nepaliPhone,

  alternatePhone: nepaliPhone.optional(),

  email: z.string().email('Invalid email address').optional(),

  country: z.enum([
    'Qatar', 'Saudi Arabia', 'UAE', 'Kuwait', 'Malaysia',
    'Bahrain', 'Oman', 'South Korea', 'Japan', 'Israel',
    'Poland', 'Romania', 'Croatia', 'Other'
  ]).optional(),

  city: z.string().max(100).optional(),

  address: z.string().max(300).optional(),

  profession: z.string().max(100).optional(),

  notes: z.string().max(500).optional(),

  isActive: z.boolean().default(true)
});

export const updateSponsorSchema = createSponsorSchema.partial();
