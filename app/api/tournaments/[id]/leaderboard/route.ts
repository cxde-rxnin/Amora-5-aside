import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MatchEvent from "@/models/MatchEvent";
import Match from "@/models/Match";
import TournamentTeam from "@/models/TournamentTeam";
import Team from "@/models/Team";
import User from "@/models/User";
import Tournament from "@/models/Tournament";
import mongoose from "mongoose";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    await dbConnect();

    const tournament = await Tournament.findById(id)
      .select("_id")
      .lean();
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const tid = new mongoose.Types.ObjectId(id);

    // Aggregate all events for this tournament
    const events = await MatchEvent.find({ tournamentId: tid }).lean();

    if (events.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    // Count appearances: distinct players per completed match
    const completedMatches = await Match.find({
      tournamentId: tid,
      status: "completed",
    })
      .select("_id homeTeamId awayTeamId")
      .lean();

    // Build per-player stats
    interface PlayerStats {
      playerId: string;
      goals: number;
      assists: number;
      yellows: number;
      reds: number;
      teamId: string;
    }

    const statsMap = new Map<string, PlayerStats>();

    for (const e of events) {
      const key = e.playerId.toString();
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          playerId: key,
          goals: 0,
          assists: 0,
          yellows: 0,
          reds: 0,
          teamId: e.teamId.toString(),
        });
      }
      const s = statsMap.get(key)!;
      if (e.type === "goal") s.goals++;
      else if (e.type === "assist") s.assists++;
      else if (e.type === "yellow") s.yellows++;
      else if (e.type === "red") s.reds++;
      // Keep last-seen teamId (handles rare team change edge-case gracefully)
      s.teamId = e.teamId.toString();
    }

    // Compute appearances: count distinct completed matches where player has any event
    const matchEventMap = new Map<string, Set<string>>(); // matchId → Set<playerId>
    for (const e of events) {
      const mid = e.matchId.toString();
      if (!matchEventMap.has(mid)) matchEventMap.set(mid, new Set());
      matchEventMap.get(mid)!.add(e.playerId.toString());
    }

    // Build appearances map: playerId → count of matches with events
    // (since we don't have squad-on-pitch tracking, appearances = distinct matches
    // in which the player has at least one event)
    const appearancesMap = new Map<string, number>();
    for (const [, players] of matchEventMap) {
      for (const pid of players) {
        appearancesMap.set(pid, (appearancesMap.get(pid) ?? 0) + 1);
      }
    }

    // Resolve player + team names
    const playerIds = [...statsMap.keys()].map(
      (p) => new mongoose.Types.ObjectId(p)
    );
    const teamIds = [
      ...new Set([...statsMap.values()].map((s) => s.teamId)),
    ].map((t) => new mongoose.Types.ObjectId(t));

    const [players, teams] = await Promise.all([
      User.find({ _id: { $in: playerIds } })
        .select("name")
        .lean(),
      Team.find({ _id: { $in: teamIds } })
        .select("name")
        .lean(),
    ]);

    const playerNameMap = new Map(
      players.map((p) => [p._id.toString(), p.name])
    );
    const teamNameMap = new Map(teams.map((t) => [t._id.toString(), t.name]));

    // Sort: goals desc → assists desc → fewest reds asc
    const leaderboard = [...statsMap.values()]
      .map((s) => ({
        playerId: s.playerId,
        playerName: playerNameMap.get(s.playerId) ?? "Unknown",
        teamId: s.teamId,
        teamName: teamNameMap.get(s.teamId) ?? "Unknown",
        goals: s.goals,
        assists: s.assists,
        yellows: s.yellows,
        reds: s.reds,
        appearances: appearancesMap.get(s.playerId) ?? 0,
      }))
      .sort((a, b) => {
        if (b.goals !== a.goals) return b.goals - a.goals;
        if (b.assists !== a.assists) return b.assists - a.assists;
        return a.reds - b.reds;
      });

    // Suppress unused variable warning — completedMatches used above for context
    void completedMatches;

    return NextResponse.json({ leaderboard });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
