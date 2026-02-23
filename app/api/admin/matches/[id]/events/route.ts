import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
import MatchEvent from "@/models/MatchEvent";
import Tournament from "@/models/Tournament";
import TeamMember from "@/models/TeamMember";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/getCurrentUser";
import mongoose from "mongoose";

const addEventSchema = z.object({
  playerId: z.string().min(1),
  teamId: z.string().min(1),
  type: z.enum(["goal", "assist", "yellow", "red"]),
  minute: z.number().int().min(1).max(120).optional(),
});

// GET /api/admin/matches/[id]/events — list events for a match
export async function GET(
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
      return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });
    }

    await dbConnect();

    const events = await MatchEvent.find({ matchId: id })
      .sort({ minute: 1, createdAt: 1 })
      .lean();

    if (events.length === 0) {
      return NextResponse.json({ events: [] });
    }

    // Resolve player names
    const playerIds = [...new Set(events.map((e) => e.playerId.toString()))];
    const players = await User.find({
      _id: { $in: playerIds.map((p) => new mongoose.Types.ObjectId(p)) },
    })
      .select("name")
      .lean();
    const playerMap = new Map(players.map((p) => [p._id.toString(), p.name]));

    const serialized = events.map((e) => ({
      id: e._id.toString(),
      matchId: e.matchId.toString(),
      tournamentId: e.tournamentId.toString(),
      teamId: e.teamId.toString(),
      playerId: e.playerId.toString(),
      playerName: playerMap.get(e.playerId.toString()) ?? "Unknown",
      type: e.type,
      minute: e.minute ?? null,
      createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json({ events: serialized });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/matches/[id]/events — add an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });
    }

    const body = await request.json();
    const result = addEventSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { playerId, teamId, type, minute } = result.data;

    if (
      !mongoose.Types.ObjectId.isValid(playerId) ||
      !mongoose.Types.ObjectId.isValid(teamId)
    ) {
      return NextResponse.json(
        { error: "Invalid playerId or teamId" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Load match
    const match = await Match.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.status !== "completed") {
      return NextResponse.json(
        { error: "Events can only be added to completed matches" },
        { status: 400 }
      );
    }

    // Load tournament — block editing after completion
    const tournament = await Tournament.findById(match.tournamentId)
      .select("status")
      .lean();
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }
    if (tournament.status === "completed") {
      return NextResponse.json(
        { error: "Cannot add events after tournament has been completed" },
        { status: 400 }
      );
    }

    // Validate teamId is one of the match's teams
    const matchTeamIds = [
      match.homeTeamId.toString(),
      match.awayTeamId.toString(),
    ];
    if (!matchTeamIds.includes(teamId)) {
      return NextResponse.json(
        { error: "Team is not part of this match" },
        { status: 400 }
      );
    }

    // Validate player belongs to the team (via TeamMember)
    const membership = await TeamMember.findOne({
      teamId: new mongoose.Types.ObjectId(teamId),
      userId: new mongoose.Types.ObjectId(playerId),
    }).lean();
    if (!membership) {
      return NextResponse.json(
        { error: "Player is not a member of this team" },
        { status: 400 }
      );
    }

    const event = await MatchEvent.create({
      matchId: new mongoose.Types.ObjectId(id),
      tournamentId: match.tournamentId,
      teamId: new mongoose.Types.ObjectId(teamId),
      playerId: new mongoose.Types.ObjectId(playerId),
      type,
      minute,
    });

    // Fetch player name for response
    const playerDoc = await User.findById(playerId).select("name").lean();

    return NextResponse.json(
      {
        message: "Event added",
        event: {
          id: event._id.toString(),
          playerId,
          playerName: playerDoc?.name ?? "Unknown",
          teamId,
          type,
          minute: event.minute ?? null,
          createdAt: event.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
