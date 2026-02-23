import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
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

    const tournament = await Tournament.findById(id).select("name").lean();
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const matches = await Match.find({ tournamentId: id })
      .sort({ round: 1, createdAt: 1 })
      .lean();

    if (matches.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Collect all unique team IDs
    const teamIdSet = new Set<string>();
    for (const m of matches) {
      teamIdSet.add(m.homeTeamId.toString());
      teamIdSet.add(m.awayTeamId.toString());
    }

    const teams = await Team.find({
      _id: { $in: [...teamIdSet].map((t) => new mongoose.Types.ObjectId(t)) },
    })
      .select("name")
      .lean();

    const teamMap = new Map(teams.map((t) => [t._id.toString(), t.name]));

    const serialized = matches.map((m) => ({
      id: m._id.toString(),
      round: m.round,
      matchDate: m.matchDate?.toISOString() ?? null,
      homeTeamId: m.homeTeamId.toString(),
      awayTeamId: m.awayTeamId.toString(),
      homeTeamName: teamMap.get(m.homeTeamId.toString()) ?? "Unknown",
      awayTeamName: teamMap.get(m.awayTeamId.toString()) ?? "Unknown",
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      status: m.status,
      winnerTeamId: m.winnerTeamId?.toString() ?? null,
    }));

    return NextResponse.json({ matches: serialized });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
