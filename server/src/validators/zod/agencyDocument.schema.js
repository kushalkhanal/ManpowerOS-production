import { z } from 'zod';

export const agencyDocumentSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().trim().optional().nullable(),
  category: z.string().min(1, "Category is required"),
  visibleToRoles: z.string().optional().default('[]'),
  isConfidential: z.string().optional().default('false'),
  version: z.string().optional().nullable(),
  previousVersionId: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  expiryAlertDays: z.string().optional().nullable(),
  tags: z.string().optional().default('[]')
});

export const agencyDocumentUpdateSchema = agencyDocumentSchema.partial();
