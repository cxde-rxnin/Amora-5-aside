import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import TournamentTeam from "@/models/TournamentTeam";
import Team from "@/models/Team";
import { getCurrentUser } from "@/lib/getCurrentUser";
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

    const tournament = await Tournament.findById(id).lean();
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Count confirmed registrations
    const registeredTeamCount = await TournamentTeam.countDocuments({
      tournamentId: tournament._id,
      paymentStatus: { $in: ["paid", "free"] },
    });

    // Check user registration
    const user = await getCurrentUser();
    let userRegistration = null;

    if (user) {
      // Find teams the user captains
      const captainedTeams = await Team.find({
        captainId: new mongoose.Types.ObjectId(user.id),
      })
        .select("_id")
        .lean();

      if (captainedTeams.length > 0) {
        const captainedTeamIds = captainedTeams.map((t) => t._id);
        const registration = await TournamentTeam.findOne({
          tournamentId: tournament._id,
          teamId: { $in: captainedTeamIds },
        }).lean();

        if (registration) {
          userRegistration = {
            tournamentTeamId: registration._id.toString(),
            teamId: registration.teamId.toString(),
            paymentStatus: registration.paymentStatus,
            registeredAt: registration.registeredAt.toISOString(),
          };
        }
      }
    }

    return NextResponse.json({
      tournament: {
        id: tournament._id.toString(),
        name: tournament.name,
        description: tournament.description,
        bannerImage: tournament.bannerImage,
        format: tournament.format,
        maxTeams: tournament.maxTeams,
        squadSizeLimit: tournament.squadSizeLimit,
        entryFee: tournament.entryFee,
        registrationOpen: tournament.registrationOpen.toISOString(),
        registrationClose: tournament.registrationClose.toISOString(),
        status: tournament.status,
        registeredTeamCount,
      },
      userRegistration,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
