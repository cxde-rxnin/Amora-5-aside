import { z } from "zod";

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(2, "Team name must be at least 2 characters")
    .max(50, "Team name cannot exceed 50 characters"),
  description: z
    .string()
    .max(300, "Description cannot exceed 300 characters")
    .optional(),
});

export const updateTeamSchema = z.object({
  name: z
    .string()
    .min(2, "Team name must be at least 2 characters")
    .max(50, "Team name cannot exceed 50 characters")
    .optional(),
  description: z
    .string()
    .max(300, "Description cannot exceed 300 characters")
    .optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email("Please provide a valid email"),
  role: z.enum(["captain", "player"]).default("player"),
  jerseyNumber: z.number().min(1).max(99).optional(),
  position: z.string().max(30).optional(),
});

export const updateMemberSchema = z.object({
  role: z.enum(["captain", "player"]).optional(),
  jerseyNumber: z.number().min(1).max(99).nullable().optional(),
  position: z.string().max(30).nullable().optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
