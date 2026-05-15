import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title too long"),
  description: z.string()
    .trim()
    .max(2000, "Description too long")
    .optional()
    .nullable(),
  taskType: z.string()
    .trim()
    .min(1, "Task type required")
    .max(100, "Task type too long"),
  assignedTo: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid assignee ID"),
  candidateId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid candidate ID")
    .optional()
    .nullable(),
  demandId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid demand ID")
    .optional()
    .nullable(),
  dueDate: z.string()
    .or(z.date())
    .transform((val) => val ? new Date(val) : undefined)
    .optional()
    .nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent'])
    .optional()
    .default('medium'),
  notes: z.string()
    .trim()
    .max(2000, "Notes too long")
    .optional()
    .nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled'])
    .optional()
    .default('pending')
});

export const taskUpdateSchema = taskSchema.partial();

export const taskStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  notes: z.string()
    .trim()
    .max(2000, "Notes too long")
    .optional()
    .nullable()
});
