import { z } from "zod";
import { phoneSchema } from "@/lib/validation";

export const createEventSchema = z.object({
  name: z.string().trim().min(1).max(100),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  helpDeskNumber: phoneSchema,
});

export const createMeetPointSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const volunteerApplySchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  phone: phoneSchema,
});
