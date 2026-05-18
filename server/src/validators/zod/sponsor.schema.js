import { z } from "zod";

// Primary phone (Nepal - 10 digits)
const phoneSchema = z
  .string()
  .trim()
  .regex(/^9\d{9}$/, "Phone number must be exactly 10 digits starting with 9")
  .length(10, "Phone number must be exactly 10 digits");

// Alternate phone (can be international)
const alternatePhoneSchema = z
  .string()
  .trim()
  .regex(/^[\d+\-\s()]+$/, "Phone contains invalid characters")
  .min(7, "Phone must be at least 7 digits")
  .max(20, "Phone too long");

const optionalAlternatePhoneSchema = alternatePhoneSchema
  .optional()
  .nullable()
  .or(z.literal(""));

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name too long")
  .regex(/^[a-zA-Z\s.'-]+$/, "Name contains invalid characters");

export const sponsorSchema = z.object({
  fullName: nameSchema,
  fullNameNepali: z.string().trim().max(100).optional().nullable(),
  phone: phoneSchema,
  alternatePhone: optionalAlternatePhoneSchema,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email")
    .max(255)
    .optional()
    .nullable()
    .or(z.literal("")),
  photo: z.string().url("Invalid photo URL").max(500).optional().nullable(),

  coverageProvinces: z
    .array(z.string().trim().max(100))
    .max(10, "Too many provinces")
    .optional()
    .default([]),
  coverageDistricts: z
    .array(z.string().trim().max(100))
    .max(100, "Too many districts")
    .optional()
    .default([]),
  coverageMunicipalities: z
    .array(z.string().trim().max(100))
    .max(200, "Too many municipalities")
    .optional()
    .default([]),
  primaryArea: z.string().trim().max(200).optional().nullable(),

  citizenshipNumber: z.string().trim().max(50).optional().nullable(),
  citizenshipIssuedDistrict: z.string().trim().max(100).optional().nullable(),
  citizenshipIssuedDate: z
    .string()
    .or(z.date())
    .transform((val) => (val ? new Date(val) : undefined))
    .optional()
    .nullable(),
  nationalIdNumber: z.string().trim().max(50).optional().nullable(),

  permanentProvince: z.string().trim().max(100).optional().nullable(),
  permanentDistrict: z.string().trim().max(100).optional().nullable(),
  permanentMunicipality: z.string().trim().max(100).optional().nullable(),
  permanentWardNo: z.string().trim().max(10).optional().nullable(),
  currentAddress: z.string().trim().max(500).optional().nullable(),

  bankName: z.string().trim().max(100).optional().nullable(),
  bankBranch: z.string().trim().max(100).optional().nullable(),
  bankAccountNumber: z.string().trim().max(50).optional().nullable(),
  bankAccountName: z.string().trim().max(100).optional().nullable(),

  assignedStaffId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid staff ID")
    .optional()
    .nullable(),
  relationshipStartDate: z
    .string()
    .or(z.date())
    .transform((val) => (val ? new Date(val) : undefined))
    .optional(),
  notes: z.string().trim().max(2000).optional().nullable(),

  role: z
    .enum(["agent", "senior_agent", "partner", "coordinator", "manager"])
    .optional()
    .default("agent"),
  overseasCompany: z.string().trim().max(200).optional().nullable(),
  sponsorNumber: z.string().trim().max(50).optional().nullable(),
  sponsorContactNumber: optionalAlternatePhoneSchema,
  permissions: z
    .array(
      z.enum([
        "canReferCandidates",
        "canViewOwnCandidates",
        "canEditOwnCandidates",
        "canDeleteOwnCandidates",
        "canViewAllCandidates",
        "canExportCandidates",
      ]),
    )
    .max(10, "Too many permissions")
    .optional()
    .default([]),
  isActive: z.boolean().optional().default(true),
});

export const sponsorUpdateSchema = sponsorSchema
  .partial()
  .omit({ agencyId: true });

export const sponsorRoleUpdateSchema = z.object({
  role: z.enum(["agent", "senior_agent", "partner", "coordinator", "manager"]),
});

export const sponsorPermissionsUpdateSchema = z.object({
  permissions: z
    .array(
      z.enum([
        "canReferCandidates",
        "canViewOwnCandidates",
        "canEditOwnCandidates",
        "canDeleteOwnCandidates",
        "canViewAllCandidates",
        "canExportCandidates",
      ]),
    )
    .max(10, "Too many permissions"),
});

export const sponsorAssignStaffSchema = z.object({
  assignedStaffId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid staff ID")
    .nullable(),
});

export const sponsorToggleActiveSchema = z.object({
  isActive: z.boolean(),
  deactivatedReason: z.string().trim().max(500).optional().nullable(),
});
