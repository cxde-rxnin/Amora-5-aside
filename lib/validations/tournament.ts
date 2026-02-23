import { z } from "zod";

export const createTournamentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().optional(),
  bannerImage: z.string().optional(),
  format: z.string().min(1, "Format is required"),
  maxTeams: z.number().int().min(2, "Must allow at least 2 teams"),
  squadSizeLimit: z.number().int().min(1, "Squad size must be at least 1"),
  entryFee: z.number().min(0, "Entry fee cannot be negative").default(0),
  registrationOpen: z.string().min(1, "Registration open date is required"),
  registrationClose: z.string().min(1, "Registration close date is required"),
});

export const updateTournamentSchema = createTournamentSchema.partial().extend({
  status: z.enum(["draft", "open", "ongoing", "completed"]).optional(),
});

export const registerTeamSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;
export type RegisterTeamInput = z.infer<typeof registerTeamSchema>;
