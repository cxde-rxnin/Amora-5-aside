import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import TournamentTeam from "@/models/TournamentTeam";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { createTournamentSchema } from "@/lib/validations/tournament";
import { logAdminAction } from "@/lib/audit";
import mongoose from "mongoose";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const tournaments = await Tournament.find({})
      .sort({ createdAt: -1 })
      .lean();

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
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({ tournaments: serialized });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = createTournamentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;

    await dbConnect();

    const tournament = await Tournament.create({
      name: data.name,
      description: data.description,
      bannerImage: data.bannerImage,
      format: data.format,
      maxTeams: data.maxTeams,
      squadSizeLimit: data.squadSizeLimit,
      entryFee: data.entryFee,
      registrationOpen: new Date(data.registrationOpen),
      registrationClose: new Date(data.registrationClose),
      status: "draft",
      createdBy: new mongoose.Types.ObjectId(user.id),
    });

    await logAdminAction(user.id, "create_tournament", "tournament", tournament._id, {
      name: tournament.name,
      format: tournament.format,
      entryFee: tournament.entryFee,
    });

    return NextResponse.json(
      {
        message: "Tournament created",
        tournament: {
          id: tournament._id.toString(),
          name: tournament.name,
          status: tournament.status,
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
