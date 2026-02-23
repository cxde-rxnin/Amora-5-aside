import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import TournamentTeam from "@/models/TournamentTeam";

export async function GET() {
  try {
    await dbConnect();

    const tournaments = await Tournament.find({
      status: { $in: ["open", "ongoing"] },
    })
      .sort({ registrationOpen: 1 })
      .lean();

    // Count confirmed registrations (paid + free) per tournament
    const tournamentIds = tournaments.map((t) => t._id);
    const counts = await TournamentTeam.aggregate([
      {
        $match: {
          tournamentId: { $in: tournamentIds },
          paymentStatus: { $in: ["paid", "free"] },
        },
      },
      { $group: { _id: "$tournamentId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

    const serialized = tournaments.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      description: t.description,
      bannerImage: t.bannerImage,
      format: t.format,
      maxTeams: t.maxTeams,
      squadSizeLimit: t.squadSizeLimit,
      entryFee: t.entryFee,
      registrationOpen: t.registrationOpen.toISOString(),
      registrationClose: t.registrationClose.toISOString(),
      status: t.status,
      registeredTeamCount: countMap.get(t._id.toString()) ?? 0,
    }));

    return NextResponse.json({ tournaments: serialized });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
