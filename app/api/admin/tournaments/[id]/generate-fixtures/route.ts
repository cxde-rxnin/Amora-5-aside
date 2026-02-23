import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import TournamentTeam from "@/models/TournamentTeam";
import Match from "@/models/Match";
import { getCurrentUser } from "@/lib/getCurrentUser";
import {
  isLeagueFormat,
  generateLeagueFixtures,
  generateKnockoutFixtures,
  isPowerOfTwo,
} from "@/lib/fixtures";
import { logAdminAction } from "@/lib/audit";
import mongoose from "mongoose";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    await dbConnect();

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    if (tournament.status !== "open") {
      return NextResponse.json(
        { error: "Fixtures can only be generated for tournaments with status 'open'" },
        { status: 400 }
      );
    }

    // Check no fixtures already generated (idempotency guard)
    const existingCount = await Match.countDocuments({
      tournamentId: tournament._id,
    });
    if (existingCount > 0) {
      return NextResponse.json(
        { error: "Fixtures have already been generated for this tournament" },
        { status: 409 }
      );
    }

    // Get confirmed (paid + free) registered teams
    const registrations = await TournamentTeam.find({
      tournamentId: tournament._id,
      paymentStatus: { $in: ["paid", "free"] },
    })
      .select("teamId")
      .lean();

    const teamIds = registrations.map((r) => r.teamId);

    if (teamIds.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 registered teams to generate fixtures" },
        { status: 400 }
      );
    }

    const league = isLeagueFormat(tournament.format);

    // Knockout: teams must be a power of 2
    if (!league && !isPowerOfTwo(teamIds.length)) {
      return NextResponse.json(
        {
          error: `Knockout tournaments require a power-of-2 number of teams (2, 4, 8, 16, …). Currently have ${teamIds.length} teams.`,
        },
        { status: 400 }
      );
    }

    // Generate match specs
    const specs = league
      ? generateLeagueFixtures(teamIds)
      : generateKnockoutFixtures(teamIds);

    // Bulk insert matches
    const matchDocs = specs.map((s) => ({
      tournamentId: tournament._id,
      homeTeamId: s.homeTeamId,
      awayTeamId: s.awayTeamId,
      round: s.round,
      homeScore: 0,
      awayScore: 0,
      status: "scheduled" as const,
    }));

    await Match.insertMany(matchDocs);

    // Advance tournament to ongoing
    tournament.status = "ongoing";
    await tournament.save();

    await logAdminAction(user.id, "generate_fixtures", "tournament", tournament._id, {
      format: tournament.format,
      teamCount: teamIds.length,
      matchCount: matchDocs.length,
    });

    return NextResponse.json({
      message: "Fixtures generated successfully",
      matchCount: matchDocs.length,
      tournamentStatus: "ongoing",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
