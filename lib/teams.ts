import crypto from "crypto";

/**
 * Generate a short, unique invite code for teams.
 * e.g., "A1B2C3"
 */
export function generateInviteCode(length: number = 8): string {
    return crypto
        .randomBytes(Math.ceil(length / 2))
        .toString("hex")
        .toUpperCase()
        .slice(0, length);
}
