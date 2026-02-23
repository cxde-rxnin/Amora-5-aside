import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { updateTeamSchema } from "@/lib/validations/team";

// GET /api/teams/:id — get team details with members
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const team = await Team.findById(id).lean();
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check user is a member
    const membership = await TeamMember.findOne({
      teamId: id,
      userId: user.id,
    }).lean();

    if (!membership && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all members with user info
    const members = await TeamMember.find({ teamId: id }).lean();
    const userIds = members.map((m) => m.userId);
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const serializedMembers = members.map((m) => {
      const u = userMap.get(m.userId.toString());
      return {
        id: m._id.toString(),
        userId: m.userId.toString(),
        name: u?.name || "Unknown",
        email: u?.email || "",
        role: m.role,
        jerseyNumber: m.jerseyNumber || null,
        position: m.position || null,
        joinedAt: m.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      team: {
        id: team._id.toString(),
        name: team.name,
        description: team.description || null,
        captainId: team.captainId.toString(),
        myRole: membership?.role || (user.role === "admin" ? "admin" : null),
        createdAt: team.createdAt.toISOString(),
      },
      members: serializedMembers,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/teams/:id — update team details (captain only)
export async function PATCH(
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
    const result = updateTeamSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    await dbConnect();

    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.captainId.toString() !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only the captain can edit the team" },
        { status: 403 }
      );
    }

    if (result.data.name) team.name = result.data.name;
    if (result.data.description !== undefined)
      team.description = result.data.description;

    await team.save();

    return NextResponse.json({
      message: "Team updated",
      team: {
        id: team._id.toString(),
        name: team.name,
        description: team.description || null,
        captainId: team.captainId.toString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/:id — delete a team (captain only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.captainId.toString() !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only the captain can delete the team" },
        { status: 403 }
      );
    }

    // Remove all members, then the team
    await TeamMember.deleteMany({ teamId: id });
    await Team.findByIdAndDelete(id);

    return NextResponse.json({ message: "Team deleted" });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
