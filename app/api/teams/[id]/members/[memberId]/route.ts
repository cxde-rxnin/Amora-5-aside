import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { updateMemberSchema } from "@/lib/validations/team";

// PATCH /api/teams/:id/members/:memberId — update a member (captain only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id, memberId } = await params;
    const body = await request.json();
    const result = updateMemberSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    await dbConnect();

    const team = await Team.findById(id).lean();
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.captainId.toString() !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only the captain can update members" },
        { status: 403 }
      );
    }

    const member = await TeamMember.findOne({ _id: memberId, teamId: id });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (result.data.role !== undefined) member.role = result.data.role;
    if (result.data.jerseyNumber !== undefined)
      member.jerseyNumber = result.data.jerseyNumber ?? undefined;
    if (result.data.position !== undefined)
      member.position = result.data.position ?? undefined;

    await member.save();

    return NextResponse.json({
      message: "Member updated",
      member: {
        id: member._id.toString(),
        role: member.role,
        jerseyNumber: member.jerseyNumber || null,
        position: member.position || null,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/:id/members/:memberId — remove a member
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id, memberId } = await params;
    await dbConnect();

    const team = await Team.findById(id).lean();
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const member = await TeamMember.findOne({ _id: memberId, teamId: id });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const isCaptain = team.captainId.toString() === user.id;
    const isSelf = member.userId.toString() === user.id;

    // Captain can remove anyone; players can only remove themselves
    if (!isCaptain && !isSelf && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Cannot remove the captain from the team
    if (member.userId.toString() === team.captainId.toString()) {
      return NextResponse.json(
        { error: "Cannot remove the team captain. Transfer captaincy first." },
        { status: 400 }
      );
    }

    await TeamMember.findByIdAndDelete(memberId);

    return NextResponse.json({ message: "Member removed" });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
