import { z } from 'zod';

const insuranceSsfBaseSchema = z.object({
  candidateId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid candidate ID format"),
  insurancePolicyNumber: z.string()
    .trim()
    .max(100, "Policy number too long")
    .optional()
    .nullable(),
  insuranceCompany: z.string()
    .trim()
    .min(2, "Insurance company name must be at least 2 characters")
    .max(200, "Insurance company name too long")
    .optional()
    .nullable(),
  insurancePremiumNPR: z.number()
    .nonnegative("Insurance premium cannot be negative")
    .max(100000, "Insurance premium too high")
    .optional()
    .default(1674),
  insurancePaidDate: z.string()
    .or(z.date())
    .transform((val) => val ? new Date(val) : undefined)
    .refine((date) => {
      if (!date) return true;
      return date <= new Date();
    }, { message: "Insurance paid date cannot be in the future" })
    .optional()
    .nullable(),
  insurancePaidReceiptUrl: z.string()
    .url("Invalid receipt URL")
    .max(500, "URL too long")
    .optional()
    .nullable(),
  insuranceCoverageYears: z.number()
    .int("Coverage years must be a whole number")
    .positive("Coverage years must be positive")
    .min(1, "Coverage must be at least 1 year")
    .max(5, "Coverage cannot exceed 5 years")
    .optional()
    .default(2),
  insuranceExpiryDate: z.string()
    .or(z.date())
    .transform((val) => val ? new Date(val) : undefined)
    .refine((date) => {
      if (!date) return true;
      return date > new Date();
    }, { message: "Insurance expiry date must be in the future" })
    .optional()
    .nullable(),
  ssfRegistrationNumber: z.string()
    .trim()
    .max(50, "SSF registration number too long")
    .optional()
    .nullable(),
  ssfContributionNPR: z.number()
    .nonnegative("SSF contribution cannot be negative")
    .max(100000, "SSF contribution too high")
    .optional()
    .default(2595),
  ssfPaidDate: z.string()
    .or(z.date())
    .transform((val) => val ? new Date(val) : undefined)
    .refine((date) => {
      if (!date) return true;
      return date <= new Date();
    }, { message: "SSF paid date cannot be in the future" })
    .optional()
    .nullable(),
  ssfReceiptNumber: z.string()
    .trim()
    .max(100, "SSF receipt number too long")
    .optional()
    .nullable(),
  ssfReceiptUrl: z.string()
    .url("Invalid receipt URL")
    .max(500, "URL too long")
    .optional()
    .nullable(),
  welfareFundPaid: z.boolean().optional().default(false),
  welfareFundAmount: z.number()
    .nonnegative("Welfare fund amount cannot be negative")
    .max(100000, "Welfare fund amount too high")
    .optional()
    .nullable(),
  welfareFundReceiptNumber: z.string()
    .trim()
    .max(100, "Receipt number too long")
    .optional()
    .nullable(),
  welfareFundPaidDate: z.string()
    .or(z.date())
    .transform((val) => val ? new Date(val) : undefined)
    .refine((date) => {
      if (!date) return true;
      return date <= new Date();
    }, { message: "Welfare fund paid date cannot be in the future" })
    .optional()
    .nullable(),
  notes: z.string()
    .trim()
    .max(2000, "Notes too long")
    .optional()
    .nullable()
});

// Schema with refinements for creation
export const insuranceSsfSchema = insuranceSsfBaseSchema.refine((data) => {
  // Insurance expiry date should be after paid date
  if (data.insurancePaidDate && data.insuranceExpiryDate) {
    return data.insuranceExpiryDate > data.insurancePaidDate;
  }
  return true;
}, {
  message: "Insurance expiry date must be after paid date",
  path: ["insuranceExpiryDate"]
}).refine((data) => {
  // If coverage years specified, validate expiry date matches
  if (data.insurancePaidDate && data.insuranceExpiryDate && data.insuranceCoverageYears) {
    const expectedExpiry = new Date(data.insurancePaidDate);
    expectedExpiry.setFullYear(expectedExpiry.getFullYear() + data.insuranceCoverageYears);
    const daysDiff = Math.abs((data.insuranceExpiryDate - expectedExpiry) / (24 * 60 * 60 * 1000));
    // Allow 30 days variance
    return daysDiff <= 30;
  }
  return true;
}, {
  message: "Insurance expiry date should match the coverage period",
  path: ["insuranceExpiryDate"]
}).refine((data) => {
  // If welfare fund is paid, amount and date should be provided
  if (data.welfareFundPaid) {
    return data.welfareFundAmount && data.welfareFundPaidDate;
  }
  return true;
}, {
  message: "Welfare fund amount and paid date are required when welfare fund is marked as paid",
  path: ["welfareFundAmount"]
});

export const insuranceSsfUpdateSchema = insuranceSsfBaseSchema.partial().omit({ candidateId: true });
