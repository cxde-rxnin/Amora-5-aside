import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Team from "@/models/Team";
import TournamentTeam from "@/models/TournamentTeam";
import Tournament from "@/models/Tournament";
import { getCurrentUser } from "@/lib/getCurrentUser";
import mongoose from "mongoose";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await dbConnect();

    // Find teams captained by this user
    const captainedTeams = await Team.find({
      captainId: new mongoose.Types.ObjectId(user.id),
    })
      .select("_id name")
      .lean();

    if (captainedTeams.length === 0) {
      return NextResponse.json({ registrations: [] });
    }

    const captainedTeamIds = captainedTeams.map((t) => t._id);
    const teamNameMap = new Map(
      captainedTeams.map((t) => [t._id.toString(), t.name])
    );

    // Find all tournament registrations for those teams
    const tournamentTeams = await TournamentTeam.find({
      teamId: { $in: captainedTeamIds },
    })
      .sort({ registeredAt: -1 })
      .lean();

    if (tournamentTeams.length === 0) {
      return NextResponse.json({ registrations: [] });
    }

    // Fetch tournament details
    const tournamentIds = tournamentTeams.map((tt) => tt.tournamentId);
    const tournaments = await Tournament.find({
      _id: { $in: tournamentIds },
    })
      .select("name format entryFee status")
      .lean();

    const tournamentMap = new Map(
      tournaments.map((t) => [t._id.toString(), t])
    );

    const registrations = tournamentTeams.map((tt) => {
      const tournament = tournamentMap.get(tt.tournamentId.toString());
      return {
        id: tt._id.toString(),
        tournamentId: tt.tournamentId.toString(),
        tournamentName: tournament?.name ?? "Unknown",
        format: tournament?.format ?? "Unknown",
        entryFee: tournament?.entryFee ?? 0,
        tournamentStatus: tournament?.status ?? "unknown",
        teamId: tt.teamId.toString(),
        teamName: teamNameMap.get(tt.teamId.toString()) ?? "Unknown",
        paymentStatus: tt.paymentStatus,
        registeredAt: tt.registeredAt.toISOString(),
      };
    });

    return NextResponse.json({ registrations });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
