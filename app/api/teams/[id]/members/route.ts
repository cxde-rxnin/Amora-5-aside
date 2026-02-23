import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { addMemberSchema } from "@/lib/validations/team";

// POST /api/teams/:id/members — add a member by email (captain only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = addMemberSchema.safeParse(body);

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
        { error: "Only the captain can add members" },
        { status: 403 }
      );
    }

    // Find user by email
    const targetUser = await User.findOne({
      email: result.data.email.toLowerCase(),
    }).lean();

    if (!targetUser) {
      return NextResponse.json(
        { error: "No user found with that email" },
        { status: 404 }
      );
    }

    // Check if already a member
    const existing = await TeamMember.findOne({
      teamId: id,
      userId: targetUser._id,
    }).lean();

    if (existing) {
      return NextResponse.json(
        { error: "This user is already a member of the team" },
        { status: 409 }
      );
    }

    const member = await TeamMember.create({
      teamId: id,
      userId: targetUser._id,
      role: result.data.role,
      jerseyNumber: result.data.jerseyNumber,
      position: result.data.position,
    });

    return NextResponse.json(
      {
        message: "Member added",
        member: {
          id: member._id.toString(),
          userId: targetUser._id.toString(),
          name: targetUser.name,
          email: targetUser.email,
          role: member.role,
          jerseyNumber: member.jerseyNumber || null,
          position: member.position || null,
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
