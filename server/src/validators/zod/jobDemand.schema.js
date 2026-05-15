import { z } from 'zod';

const optionalDate = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}, z.date().optional());

const optionalText = (max) => z.union([
  z.string().trim().max(max),
  z.literal(''),
  z.null(),
  z.undefined()
]);

const requiredText = (min, max, msg) => z.preprocess(
  (val) => (val === undefined || val === null ? '' : String(val)),
  z.string().trim().min(min, msg).max(max)
);

const optionalNumber = ({ min, max, integer = false }) => z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}, integer ? z.number().int().min(min).max(max).optional() : z.number().min(min).max(max).optional());

// Keep permissive, just block obviously invalid lengths.
const phoneSchema = z.union([
  z.string().trim().min(7, 'Phone is too short').max(30, 'Phone is too long'),
  z.literal(''),
  z.null(),
  z.undefined()
]);

const jobDemandBaseSchema = z.object({
  employerCompanyName: requiredText(2, 200, "Company name must be at least 2 characters"),
  shortCompanyCode: optionalText(20),
  employerCountry: requiredText(2, 100, "Country is required"),
  employerCity: optionalText(100),
  employerContactPerson: optionalText(100),
  employerPhone: phoneSchema,
  employerEmail: z.union([
    z.literal(''),
    z.string()
      .trim()
      .toLowerCase()
      .email("Invalid email format")
      .max(255),
    z.null()
  ]).optional(),
  
  demandLetterNumber: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : String(val).trim()),
    z.string().max(100).optional()
  ),
  lotNumber: requiredText(1, 100, 'Lot number is required'),
  demandLetterDate: optionalDate,
  demandLetterExpiryDate: optionalDate,
  
  jobCategory: requiredText(1, 100, "Job category is required"),
  totalPositions: optionalNumber({ min: 1, max: 10000, integer: true }),
  basicSalaryUSD: optionalNumber({ min: 0, max: 1000000 }),
  
  accommodationProvided: z.boolean().optional().default(false),
  foodProvided: z.boolean().optional().default(false),
  contractDurationMonths: optionalNumber({ min: 1, max: 120, integer: true }),
  workingHoursPerDay: optionalNumber({ min: 1, max: 24, integer: true }),
  
  purbaSwukritiNumber: optionalText(100),
  purbaSwukritiDate: optionalDate,
  purbaSwukritiExpiryDate: optionalDate,
  
  notes: optionalText(2000),
  status: z.enum(['active', 'filled', 'expired', 'cancelled'])
    .optional()
    .default('active')
});

export const jobDemandSchema = jobDemandBaseSchema.superRefine((data, ctx) => {
  if (!data.totalPositions) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['totalPositions'],
      message: 'Total positions is required'
    });
  }

  // Keep only this essential date-order validation.
  if (data.demandLetterDate && data.demandLetterExpiryDate && data.demandLetterExpiryDate <= data.demandLetterDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['demandLetterExpiryDate'],
      message: 'Demand letter expiry date must be after issue date'
    });
  }
});

export const jobDemandUpdateSchema = jobDemandBaseSchema.partial();
