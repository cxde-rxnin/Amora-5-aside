import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { updateTournamentSchema } from "@/lib/validations/tournament";
import { logAdminAction } from "@/lib/audit";
import mongoose from "mongoose";

export async function PATCH(
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
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = updateTournamentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;

    await dbConnect();

    const updateFields: Record<string, unknown> = {};
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.bannerImage !== undefined) updateFields.bannerImage = data.bannerImage;
    if (data.format !== undefined) updateFields.format = data.format;
    if (data.maxTeams !== undefined) updateFields.maxTeams = data.maxTeams;
    if (data.squadSizeLimit !== undefined) updateFields.squadSizeLimit = data.squadSizeLimit;
    if (data.entryFee !== undefined) updateFields.entryFee = data.entryFee;
    if (data.registrationOpen !== undefined)
      updateFields.registrationOpen = new Date(data.registrationOpen);
    if (data.registrationClose !== undefined)
      updateFields.registrationClose = new Date(data.registrationClose);
    if (data.status !== undefined) updateFields.status = data.status;

    const tournament = await Tournament.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    await logAdminAction(user.id, "update_tournament", "tournament", tournament._id, {
      updatedFields: Object.keys(updateFields),
      newStatus: tournament.status,
    });

    return NextResponse.json({
      message: "Tournament updated",
      tournament: {
        id: tournament._id.toString(),
        name: tournament.name,
        status: tournament.status,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
