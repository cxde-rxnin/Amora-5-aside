import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
import TournamentTeam from "@/models/TournamentTeam";
import Team from "@/models/Team";
import Tournament from "@/models/Tournament";
import mongoose from "mongoose";

interface TeamStats {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

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
      .select("format status")
      .lean();
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Get all registered teams (paid + free)
    const registrations = await TournamentTeam.find({
      tournamentId: new mongoose.Types.ObjectId(id),
      paymentStatus: { $in: ["paid", "free"] },
    })
      .select("teamId")
      .lean();

    if (registrations.length === 0) {
      return NextResponse.json({ standings: [] });
    }

    const teamIds = registrations.map((r) => r.teamId);

    // Fetch team names
    const teams = await Team.find({ _id: { $in: teamIds } })
      .select("name")
      .lean();
    const teamNameMap = new Map(teams.map((t) => [t._id.toString(), t.name]));

    // Initialise stats table
    const statsMap = new Map<string, TeamStats>();
    for (const tid of teamIds) {
      const key = tid.toString();
      statsMap.set(key, {
        teamId: key,
        teamName: teamNameMap.get(key) ?? "Unknown",
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      });
    }

    // Aggregate completed matches
    const matches = await Match.find({
      tournamentId: new mongoose.Types.ObjectId(id),
      status: "completed",
    }).lean();

    for (const m of matches) {
      const homeKey = m.homeTeamId.toString();
      const awayKey = m.awayTeamId.toString();
      const homeStats = statsMap.get(homeKey);
      const awayStats = statsMap.get(awayKey);

      if (!homeStats || !awayStats) continue;

      homeStats.played++;
      awayStats.played++;
      homeStats.goalsFor += m.homeScore;
      homeStats.goalsAgainst += m.awayScore;
      awayStats.goalsFor += m.awayScore;
      awayStats.goalsAgainst += m.homeScore;

      if (m.homeScore > m.awayScore) {
        homeStats.wins++;
        homeStats.points += 3;
        awayStats.losses++;
      } else if (m.homeScore < m.awayScore) {
        awayStats.wins++;
        awayStats.points += 3;
        homeStats.losses++;
      } else {
        homeStats.draws++;
        homeStats.points += 1;
        awayStats.draws++;
        awayStats.points += 1;
      }
    }

    // Compute GD and sort: Points → GD → GF
    const standings = [...statsMap.values()]
      .map((s) => ({
        ...s,
        goalDifference: s.goalsFor - s.goalsAgainst,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference)
          return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });

    return NextResponse.json({ standings });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
