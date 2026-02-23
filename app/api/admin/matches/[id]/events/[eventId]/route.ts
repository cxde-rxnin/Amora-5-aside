import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MatchEvent from "@/models/MatchEvent";
import Match from "@/models/Match";
import Tournament from "@/models/Tournament";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { logAdminAction } from "@/lib/audit";
import mongoose from "mongoose";

// DELETE /api/admin/matches/[id]/events/[eventId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, eventId } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(eventId)
    ) {
      return NextResponse.json(
        { error: "Invalid match ID or event ID" },
        { status: 400 }
      );
    }

    await dbConnect();

    const event = await MatchEvent.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Confirm event belongs to this match
    if (event.matchId.toString() !== id) {
      return NextResponse.json(
        { error: "Event does not belong to this match" },
        { status: 400 }
      );
    }

    // Load match → tournament to check completion lock
    const match = await Match.findById(id).select("tournamentId").lean();
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const tournament = await Tournament.findById(match.tournamentId)
      .select("status")
      .lean();
    if (tournament?.status === "completed") {
      return NextResponse.json(
        { error: "Cannot delete events after tournament has been completed" },
        { status: 400 }
      );
    }

    await event.deleteOne();

    await logAdminAction(user.id, "delete_match_event", "match", event.matchId, {
      eventId: eventId,
      eventType: event.type,
      playerId: event.playerId.toString(),
      teamId: event.teamId.toString(),
    });

    return NextResponse.json({ message: "Event deleted" });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
