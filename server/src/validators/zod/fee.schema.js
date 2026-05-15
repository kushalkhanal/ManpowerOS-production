import { z } from 'zod';

const TRANSACTION_TYPES = ['service_fee', 'document_charge', 'medical_charge', 'orientation_charge', 'insurance_charge', 'visa_charge', 'other'];
const DIRECTION = ['received', 'refund'];
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'esewa', 'khalti', 'ime_pay', 'cheque'];

export const feeTransactionSchema = z.object({
  candidateId: z.string().min(1, "Candidate ID required"),
  transactionType: z.enum(TRANSACTION_TYPES),
  direction: z.enum(DIRECTION),
  amountNPR: z.coerce.number().min(0, "Amount must be positive"),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  transactionReference: z.string().trim().optional().nullable(),
  paidAt: z.string().or(z.date()).transform((val) => val ? new Date(val) : undefined).optional(),
  notes: z.string().trim().optional().nullable()
});

export const feeTransactionUpdateSchema = feeTransactionSchema.partial();
