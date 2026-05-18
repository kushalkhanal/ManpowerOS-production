import { z } from "zod";
import { ASSIGNABLE_ROLES } from "../../constants/roles.js";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(255, "Email too long"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password too long"),
  rememberMe: z.boolean().optional().default(false),
});

export const registerAgencySchema = z.object({
  agencyName: z
    .string()
    .trim()
    .min(3, "Agency name must be at least 3 characters")
    .max(100, "Agency name too long")
    .regex(
      /^[a-zA-Z0-9\s\-&.,()]+$/,
      "Agency name contains invalid characters",
    ),
  subdomain: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Subdomain must be at least 3 characters")
    .max(63, "Subdomain too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Subdomain can only contain lowercase letters, numbers, and hyphens",
    )
    .regex(/^[a-z0-9]/, "Subdomain must start with letter or number")
    .regex(/[a-z0-9]$/, "Subdomain must end with letter or number"),
  adminName: z
    .string()
    .trim()
    .min(2, "Admin name required")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z\s.'-]+$/, "Name contains invalid characters"),
  adminEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid admin email address")
    .max(255, "Email too long"),
  adminPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must include uppercase, lowercase, number, and special character",
    ),
});

export const inviteUserSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(255, "Email too long"),
  name: z
    .string()
    .trim()
    .min(2, "Name required")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z\s.'-]+$/, "Name contains invalid characters"),
  role: z.enum(ASSIGNABLE_ROLES),
  department: z.string().trim().max(100).optional().nullable(),
});

export const completeInviteSchema = z.object({
  token: z.string().trim().min(64, "Invalid token").max(64, "Invalid token"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must include uppercase, lowercase, number, and special character",
    ),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().max(128).optional(),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must include uppercase, lowercase, and a number",
    ),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(255, "Email too long"),
});

export const setNewPasswordSchema = z.object({
  token: z.string().trim().min(1, "Token required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must include uppercase, lowercase, number, and special character",
    ),
});
