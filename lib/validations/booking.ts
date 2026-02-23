import { z } from "zod";

export const createBookingSchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):00$/, "Start time must be on the hour (HH:00)"),
  duration: z.number().refine((v) => v === 60 || v === 120, {
    message: "Duration must be 60 or 120 minutes",
  }),
  type: z.enum(["casual", "training", "team"]).default("casual"),
});

export const blockSlotSchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):00$/, "Start time must be on the hour (HH:00)"),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):00$/, "End time must be on the hour (HH:00)"),
  reason: z
    .string()
    .min(1, "Reason is required")
    .max(200, "Reason cannot exceed 200 characters"),
});

export const adminCreateBookingSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):00$/, "Start time must be on the hour (HH:00)"),
  duration: z.number().refine((v) => v === 60 || v === 120, {
    message: "Duration must be 60 or 120 minutes",
  }),
  type: z.enum(["casual", "training", "team"]).default("casual"),
  status: z.enum(["pending", "confirmed"]).default("pending"),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BlockSlotInput = z.infer<typeof blockSlotSchema>;
export type AdminCreateBookingInput = z.infer<typeof adminCreateBookingSchema>;
