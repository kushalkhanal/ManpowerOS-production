import { z } from 'zod';

// ─── FEIMS registration update ────────────────────────────────────────────────

export const feimsUpdateSchema = z.object({
  feimsRegistrationNumber: z.string().trim().min(1).max(50).optional(),
  feimsSubmittedAt: z.string().or(z.date()).transform(v => new Date(v)).optional(),
  feimsApprovalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  dofeFileNumber: z.string().trim().max(50).optional()
});

// ─── Shram Swukriti update ────────────────────────────────────────────────────

export const shramSwukritiUpdateSchema = z.object({
  shramSwikritiNumber: z.string().trim().min(1).max(50),
  shramIssuedDate: z.string().or(z.date()).transform(v => new Date(v)).optional(),
  shramExpiryDate: z.string().or(z.date()).transform(v => new Date(v)).optional()
});
