import { z } from 'zod';

// Phone number validation (Nepal - 10 digits)
const phoneSchema = z.string()
  .trim()
  .regex(/^9\d{9}$/, "Phone number must be exactly 10 digits starting with 9")
  .length(10, "Phone number must be exactly 10 digits");

// International phone validation (for alternate phone)
const internationalPhoneSchema = z.string()
  .trim()
  .regex(/^[\d+\-\s()]+$/, "Phone contains invalid characters")
  .min(7, "Phone must be at least 7 digits")
  .max(20, "Phone too long");

// Name validation
const nameSchema = z.string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name too long")
  .regex(/^[a-zA-Z\s.'-]+$/, "Name contains invalid characters");

// Base schema without refinements (can be used with .partial())
const candidateBaseSchema = z.object({
  fullName: nameSchema,
  fullNameNepali: z.string().trim().max(100).optional().nullable(),
  dateOfBirth: z.string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((date) => {
      const age = (new Date() - date) / (365.25 * 24 * 60 * 60 * 1000);
      return age >= 18;
    }, { message: "Candidate must be at least 18 years old" })
    .refine((date) => {
      const age = (new Date() - date) / (365.25 * 24 * 60 * 60 * 1000);
      return age <= 100;
    }, { message: "Invalid date of birth" })
    .refine((date) => date < new Date(), { message: "Date of birth must be in the past" }),
  gender: z.enum(['male', 'female', 'other']),
  nationalIdNumber: z.string()
    .trim()
    .min(2, "National ID must be at least 2 characters")
    .max(30, "National ID too long")
    .regex(/^[a-zA-Z0-9\-]+$/, "National ID contains invalid characters"),
  phone: phoneSchema,
  alternatePhone: z.union([
    z.literal(''),
    internationalPhoneSchema,
    z.null()
  ]).optional(),
  email: z.union([
    z.literal(''),
    z.string()
      .trim()
      .toLowerCase()
      .email("Invalid email format")
      .max(255, "Email too long"),
    z.null()
  ]).optional(),
  permanentProvince: z.string().trim().max(100).optional().nullable(),
  permanentDistrict: z.string().trim().max(100).optional().nullable(),
  permanentMunicipality: z.string().trim().max(100).optional().nullable(),
  permanentWardNo: z.string().trim().max(10).optional().nullable(),
  temporaryAddress: z.string().trim().max(500).optional().nullable(),
  education: z.enum(['illiterate', 'primary', 'slc', 'plus2', 'bachelor', 'master']).optional().nullable(),
  skills: z.array(z.string().trim().max(100)).max(20, "Too many skills").optional(),
  languagesKnown: z.array(z.string().trim().max(50)).max(10, "Too many languages").optional(),
  workExperienceYears: z.number()
    .int("Work experience must be a whole number")
    .min(0, "Work experience cannot be negative")
    .max(50, "Work experience cannot exceed 50 years")
    .optional()
    .nullable(),
  previousCountry: z.string().trim().max(100).optional().nullable(),
  desiredCountry: z.string().trim().max(100).optional().nullable(),
  desiredJobCategory: z.string().trim().max(100).optional().nullable(),
  referredBy: z.string().trim().max(200).optional().nullable(),
  agentId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid agent ID format")
    .optional()
    .nullable(),
  serviceFeeAgreed: z.number()
    .min(0, "Service fee cannot be negative")
    .max(1000000, "Service fee too high")
    .optional()
    .default(0),
  serviceFeeReceived: z.number()
    .min(0, "Fee received cannot be negative")
    .max(1000000, "Fee received too high")
    .optional()
    .default(0)
});

// Schema for creation with cross-field validation
export const candidateSchema = candidateBaseSchema.refine((data) => {
  if (data.serviceFeeReceived && data.serviceFeeAgreed) {
    return data.serviceFeeReceived <= data.serviceFeeAgreed;
  }
  return true;
}, {
  message: "Fee received cannot exceed fee agreed",
  path: ["serviceFeeReceived"]
});

// Schema for updates - partial without the refinement for flexibility
export const candidateUpdateSchema = candidateBaseSchema.partial();
