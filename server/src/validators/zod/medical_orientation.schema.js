import { z } from 'zod';

const medicalBaseSchema = z.object({
  candidateId: z.string()
    .min(1, "Candidate ID is required")
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid candidate ID format"),
  scheduledDate: z.string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((date) => date >= new Date(new Date().setHours(0, 0, 0, 0) - 30 * 24 * 60 * 60 * 1000), {
      message: "Scheduled date cannot be more than 30 days in the past"
    })
    .optional()
    .nullable(),
  conductedDate: z.string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((date) => date <= new Date(), {
      message: "Conducted date cannot be in the future"
    })
    .optional()
    .nullable(),
  medicalCenter: z.string()
    .trim()
    .min(2, "Medical center name must be at least 2 characters")
    .max(200, "Medical center name too long")
    .optional()
    .nullable(),
  result: z.enum(['pending', 'fit', 'unfit'], {
    errorMap: () => ({ message: "Result must be pending, fit, or unfit" })
  }).default('pending'),
  reportNumber: z.string()
    .trim()
    .max(100, "Report number too long")
    .optional()
    .nullable(),
  reportExpiryDate: z.string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((date) => date > new Date(), {
      message: "Report expiry date must be in the future"
    })
    .optional()
    .nullable(),
  notes: z.string()
    .trim()
    .max(2000, "Notes too long")
    .optional()
    .nullable(),
  referringAgency: z.string()
    .trim()
    .max(200, "Manpower / agency name too long")
    .optional()
    .nullable()
});

// Schema with refinements for creation
export const medicalSchema = medicalBaseSchema.refine((data) => {
  // Conducted date must be after or same as scheduled date
  if (data.scheduledDate && data.conductedDate) {
    return data.conductedDate >= data.scheduledDate;
  }
  return true;
}, {
  message: "Conducted date must be on or after scheduled date",
  path: ["conductedDate"]
}).refine((data) => {
  // If report expiry date exists, conducted date must exist
  if (data.reportExpiryDate && !data.conductedDate) {
    return false;
  }
  return true;
}, {
  message: "Conducted date is required when report expiry date is provided",
  path: ["conductedDate"]
}).refine((data) => {
  // Report expiry must be after conducted date
  if (data.conductedDate && data.reportExpiryDate) {
    return data.reportExpiryDate > data.conductedDate;
  }
  return true;
}, {
  message: "Report expiry date must be after conducted date",
  path: ["reportExpiryDate"]
}).refine((data) => {
  // Report expiry date is typically 3 months to 1 year from conducted date
  if (data.conductedDate && data.reportExpiryDate) {
    const daysDiff = (data.reportExpiryDate - data.conductedDate) / (24 * 60 * 60 * 1000);
    return daysDiff >= 30 && daysDiff <= 365;
  }
  return true;
}, {
  message: "Report validity should be between 1 month and 1 year from conducted date",
  path: ["reportExpiryDate"]
});

export const medicalUpdateSchema = medicalBaseSchema.partial();

const orientationBaseSchema = z.object({
  candidateId: z.string()
    .min(1, "Candidate ID is required")
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid candidate ID format"),
  batchNumber: z.string()
    .trim()
    .max(50, "Batch number too long")
    .optional()
    .nullable(),
  startDate: z.string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((date) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return date >= thirtyDaysAgo;
    }, {
      message: "Start date cannot be more than 30 days in the past"
    })
    .optional()
    .nullable(),
  endDate: z.string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional()
    .nullable(),
  completionStatus: z.enum(['pending', 'completed', 'failed'], {
    errorMap: () => ({ message: "Status must be pending, completed, or failed" })
  }).default('pending'),
  certificateNumber: z.string()
    .trim()
    .max(100, "Certificate number too long")
    .optional()
    .nullable(),
  notes: z.string()
    .trim()
    .max(2000, "Notes too long")
    .optional()
    .nullable()
});

// Schema with refinements for creation
export const orientationSchema = orientationBaseSchema.refine((data) => {
  // End date must be after start date
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "End date must be on or after start date",
  path: ["endDate"]
}).refine((data) => {
  // Orientation duration should not exceed 30 days
  if (data.startDate && data.endDate) {
    const daysDiff = (data.endDate - data.startDate) / (24 * 60 * 60 * 1000);
    return daysDiff <= 30;
  }
  return true;
}, {
  message: "Orientation duration cannot exceed 30 days",
  path: ["endDate"]
}).refine((data) => {
  // Certificate number required if status is completed
  if (data.completionStatus === 'completed' && !data.certificateNumber) {
    return false;
  }
  return true;
}, {
  message: "Certificate number is required when orientation is completed",
  path: ["certificateNumber"]
});

export const orientationUpdateSchema = orientationBaseSchema.partial();
