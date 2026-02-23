import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
import MatchEvent from "@/models/MatchEvent";
import TournamentTeam from "@/models/TournamentTeam";
import Team from "@/models/Team";
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

    // Get all confirmed teams
    const registrations = await TournamentTeam.find({
      tournamentId: tid,
      paymentStatus: { $in: ["paid", "free"] },
    })
      .select("teamId")
      .lean();

    if (registrations.length === 0) {
      return NextResponse.json({ stats: [] });
    }

    const teamIds = registrations.map((r) => r.teamId);
    const teams = await Team.find({ _id: { $in: teamIds } })
      .select("name")
      .lean();
    const teamNameMap = new Map(teams.map((t) => [t._id.toString(), t.name]));

    // Load all completed matches for this tournament
    const matches = await Match.find({
      tournamentId: tid,
      status: "completed",
    }).lean();

    // Load all card events for this tournament (goals counted via match scores)
    const cardEvents = await MatchEvent.find({
      tournamentId: tid,
      type: { $in: ["yellow", "red"] },
    }).lean();

    // Build per-team stats
    interface TeamAdvStats {
      teamId: string;
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsScored: number;
      goalsConceded: number;
      cleanSheets: number;
      mostGoalsInMatch: number;
      totalYellows: number;
      totalReds: number;
      // Last 5 results (most-recent last)
      form: Array<"W" | "D" | "L">;
      recentMatchDates: Array<Date | undefined>;
    }

    const statsMap = new Map<string, TeamAdvStats>();
    for (const tid2 of teamIds) {
      statsMap.set(tid2.toString(), {
        teamId: tid2.toString(),
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsScored: 0,
        goalsConceded: 0,
        cleanSheets: 0,
        mostGoalsInMatch: 0,
        totalYellows: 0,
        totalReds: 0,
        form: [],
        recentMatchDates: [],
      });
    }

    // Process matches (sorted by matchDate asc for form order)
    const sortedMatches = [...matches].sort(
      (a, b) =>
        (a.matchDate?.getTime() ?? a.createdAt.getTime()) -
        (b.matchDate?.getTime() ?? b.createdAt.getTime())
    );

    for (const m of sortedMatches) {
      const homeKey = m.homeTeamId.toString();
      const awayKey = m.awayTeamId.toString();
      const home = statsMap.get(homeKey);
      const away = statsMap.get(awayKey);

      if (home) {
        home.played++;
        home.goalsScored += m.homeScore;
        home.goalsConceded += m.awayScore;
        if (m.homeScore > home.mostGoalsInMatch)
          home.mostGoalsInMatch = m.homeScore;
        if (m.awayScore === 0) home.cleanSheets++;
        home.recentMatchDates.push(m.matchDate);

        if (m.homeScore > m.awayScore) {
          home.wins++;
          home.form.push("W");
        } else if (m.homeScore < m.awayScore) {
          home.losses++;
          home.form.push("L");
        } else {
          home.draws++;
          home.form.push("D");
        }
      }

      if (away) {
        away.played++;
        away.goalsScored += m.awayScore;
        away.goalsConceded += m.homeScore;
        if (m.awayScore > away.mostGoalsInMatch)
          away.mostGoalsInMatch = m.awayScore;
        if (m.homeScore === 0) away.cleanSheets++;
        away.recentMatchDates.push(m.matchDate);

        if (m.awayScore > m.homeScore) {
          away.wins++;
          away.form.push("W");
        } else if (m.awayScore < m.homeScore) {
          away.losses++;
          away.form.push("L");
        } else {
          away.draws++;
          away.form.push("D");
        }
      }
    }

    // Process cards
    for (const e of cardEvents) {
      const s = statsMap.get(e.teamId.toString());
      if (!s) continue;
      if (e.type === "yellow") s.totalYellows++;
      else if (e.type === "red") s.totalReds++;
    }

    // Assemble response — last 5 results for form
    const statsArr = [...statsMap.values()]
      .map((s) => ({
        teamId: s.teamId,
        teamName: teamNameMap.get(s.teamId) ?? "Unknown",
        played: s.played,
        wins: s.wins,
        draws: s.draws,
        losses: s.losses,
        goalsScored: s.goalsScored,
        goalsConceded: s.goalsConceded,
        goalDifference: s.goalsScored - s.goalsConceded,
        cleanSheets: s.cleanSheets,
        mostGoalsInMatch: s.mostGoalsInMatch,
        totalYellows: s.totalYellows,
        totalReds: s.totalReds,
        // Take last 5 results
        form: s.form.slice(-5),
      }))
      .sort((a, b) => {
        // Sort by most played desc, then goals scored desc
        if (b.played !== a.played) return b.played - a.played;
        return b.goalsScored - a.goalsScored;
      });

    return NextResponse.json({ stats: statsArr });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
