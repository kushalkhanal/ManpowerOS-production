import { z } from 'zod';

/**
 * Query parameter validation schemas
 */

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// Search schema
export const searchSchema = z.object({
  q: z.string().min(1).max(200).optional(),
  search: z.string().min(1).max(200).optional()
});

// Filter schema for status
export const statusFilterSchema = z.object({
  status: z.enum([
    'pending',
    'approved',
    'rejected',
    'active',
    'inactive',
    'completed',
    'processing',
    'verified',
    'unverified'
  ]).optional()
});

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  { message: 'Start date must be before or equal to end date' }
);

// MongoDB ObjectId param schema
export const mongoIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format')
});

// Combined query schema with pagination and search
export const listQuerySchema = paginationSchema.merge(searchSchema);

export default {
  paginationSchema,
  searchSchema,
  statusFilterSchema,
  dateRangeSchema,
  mongoIdParamSchema,
  listQuerySchema
};
