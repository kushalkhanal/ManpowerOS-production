import { z } from 'zod';

export const manualAlertSchema = z.object({
  message: z.string()
    .trim()
    .min(3, "Message must be at least 3 characters")
    .max(500, "Message too long"),
  severity: z.enum(['critical', 'warning', 'info'])
    .default('info'),
  targetRoles: z.array(
    z.string().trim().max(50)
  )
    .max(10, "Too many target roles")
    .optional()
    .default([]),
  targetUsers: z.array(
    z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID")
  )
    .max(100, "Too many target users")
    .optional()
    .default([]),
  actionUrl: z.string()
    .trim()
    .max(500, "URL too long")
    .optional()
    .nullable()
}).refine(data => data.targetRoles.length > 0 || data.targetUsers.length > 0, {
  message: "Please select at least one target (role or user)",
  path: ["targetRoles"]
});
