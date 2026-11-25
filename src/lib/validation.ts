import { z } from "zod";

// Loose E.164-ish check: "+" then 8-15 digits. Good enough for an MVP; a real
// deployment should validate against the SMS provider's supported formats.
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Phone must be in international format, e.g. +919876543210");

export const otpCodeSchema = z.string().regex(/^\d{6}$/, "Code must be 6 digits");

export const otpPurposeSchema = z.enum(["GUARDIAN_LOGIN", "VOLUNTEER_LOGIN", "ADMIN_LOGIN"]);

export const ageGroupSchema = z.enum(["CHILD", "ADULT", "ELDER"]);

export const backupContactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: phoneSchema,
});

export const createPersonSchema = z.object({
  eventId: z.string().uuid(),
  firstName: z.string().trim().min(1).max(60),
  photoUrl: z.string().url().optional().nullable(),
  ageGroup: ageGroupSchema,
  languages: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  medicalNotes: z.string().trim().max(2000).optional().nullable(),
  backupContacts: z.array(backupContactSchema).max(2).default([]),
});
