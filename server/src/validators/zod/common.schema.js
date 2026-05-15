import { z } from 'zod';

// Job Demand Schema
export const jobDemandSchema = z.object({
  employerName: z.string().trim().min(2, "Employer name required"),
  employerCountry: z.string().trim().min(2, "Country required"),
  jobCategory: z.string().trim().min(2, "Job category required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  salary: z.number().positive("Salary must be positive"),
  currency: z.string().default('USD'),
  expiryDate: z.string().or(z.date()).transform((val) => new Date(val)).optional().nullable(),
  status: z.enum(['active', 'completed', 'cancelled']).default('active'),
  description: z.string().optional().nullable()
});

// Fee / Transaction Schema
export const transactionSchema = z.object({
  candidateId: z.string().min(1, "Candidate ID required"),
  amountNPR: z.number().min(0, "Amount must be positive"),
  transactionType: z.enum(['service_fee', 'medical_fee', 'insurance_fee', 'orientation_fee', 'other']),
  direction: z.enum(['received', 'paid']).default('received'),
  paymentMethod: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  paidAt: z.string().or(z.date()).transform((val) => new Date(val)).default(() => new Date()),
  notes: z.string().optional().nullable()
});

// Alert / Notification Schema
export const alertSchema = z.object({
  title: z.string().trim().min(2, "Title required"),
  message: z.string().trim().min(2, "Message required"),
  type: z.enum(['info', 'warning', 'error', 'success']).default('info'),
  targetRoles: z.array(z.string()).optional().default([]),
  targetUsers: z.array(z.string()).optional().default([]),
  expiresAt: z.string().or(z.date()).transform((val) => new Date(val)).optional().nullable()
});
