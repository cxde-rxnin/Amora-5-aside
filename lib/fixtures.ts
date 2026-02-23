import mongoose from "mongoose";

export interface MatchSpec {
  homeTeamId: mongoose.Types.ObjectId;
  awayTeamId: mongoose.Types.ObjectId;
  round: string;
}

/**
 * Returns true if the format string indicates league play.
 * Matches any format containing "League" (case-insensitive).
 */
export function isLeagueFormat(format: string): boolean {
  return format.toLowerCase().includes("league");
}

/**
 * Standard round-robin algorithm (Berger table / rotation method).
 * Handles odd number of teams by inserting a BYE (null) and skipping
 * matches where one side is BYE.
 *
 * Returns one match per unique pair; each team plays every other team once.
 */
export function generateLeagueFixtures(
  teamIds: mongoose.Types.ObjectId[]
): MatchSpec[] {
  const teams: Array<mongoose.Types.ObjectId | null> = [...teamIds];

  // If odd, add a BYE slot
  if (teams.length % 2 !== 0) {
    teams.push(null);
  }

  const n = teams.length;
  const rounds = n - 1;
  const halfN = n / 2;
  const matches: MatchSpec[] = [];

  // Keep first element fixed; rotate the rest
  const rotatable = teams.slice(1);

  for (let round = 0; round < rounds; round++) {
    const roundLabel = `Round ${round + 1}`;
    const currentRound = [teams[0], ...rotatable];

    for (let i = 0; i < halfN; i++) {
      const home = currentRound[i];
      const away = currentRound[n - 1 - i];

      // Skip BYE matches
      if (home !== null && away !== null) {
        matches.push({
          homeTeamId: home,
          awayTeamId: away,
          round: roundLabel,
        });
      }
    }

    // Rotate: move last element of rotatable to front
    rotatable.unshift(rotatable.pop()!);
  }

  return matches;
}

/**
 * Returns true if n is a power of 2 and >= 2.
 */
export function isPowerOfTwo(n: number): boolean {
  return n >= 2 && (n & (n - 1)) === 0;
}

/**
 * Given the number of teams, return the round name for the first knockout round.
 */
export function knockoutRoundName(totalTeams: number): string {
  switch (totalTeams) {
    case 2:
      return "Final";
    case 4:
      return "Semi Final";
    case 8:
      return "Quarter Final";
    case 16:
      return "Round of 16";
    case 32:
      return "Round of 32";
    default:
      return `Round of ${totalTeams}`;
  }
}

/**
 * Returns the name of the next knockout round given the current one.
 */
export function nextKnockoutRound(currentRound: string): string {
  const map: Record<string, string> = {
    "Round of 32": "Round of 16",
    "Round of 16": "Quarter Final",
    "Quarter Final": "Semi Final",
    "Semi Final": "Final",
  };
  return map[currentRound] ?? "Final";
}

/**
 * Generate the first round of knockout fixtures from a list of team IDs.
 * Teams are paired sequentially: [0 vs 1, 2 vs 3, ...].
 */
export function generateKnockoutFixtures(
  teamIds: mongoose.Types.ObjectId[]
): MatchSpec[] {
  const roundName = knockoutRoundName(teamIds.length);
  const matches: MatchSpec[] = [];

  for (let i = 0; i < teamIds.length; i += 2) {
    matches.push({
      homeTeamId: teamIds[i],
      awayTeamId: teamIds[i + 1],
      round: roundName,
    });
  }

  return matches;
}

/**
 * Given a list of winner IDs from a completed knockout round,
 * generate the next round's matches.
 */
export function generateNextKnockoutRound(
  winners: mongoose.Types.ObjectId[],
  currentRound: string
): MatchSpec[] {
  const nextRound = nextKnockoutRound(currentRound);
  const matches: MatchSpec[] = [];

  for (let i = 0; i < winners.length; i += 2) {
    matches.push({
      homeTeamId: winners[i],
      awayTeamId: winners[i + 1],
      round: nextRound,
    });
  }

  return matches;
}
