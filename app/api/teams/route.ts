import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { createTeamSchema } from "@/lib/validations/team";

// GET /api/teams — list teams the current user belongs to
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await dbConnect();

    // Find all teams the user is a member of
    const memberships = await TeamMember.find({ userId: user.id }).lean();
    const teamIds = memberships.map((m) => m.teamId);

    const teams = await Team.find({ _id: { $in: teamIds } })
      .sort({ createdAt: -1 })
      .lean();

    const membershipMap = new Map(
      memberships.map((m) => [m.teamId.toString(), m])
    );

    // Count members per team
    const memberCounts = await TeamMember.aggregate([
      { $match: { teamId: { $in: teamIds } } },
      { $group: { _id: "$teamId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(
      memberCounts.map((c) => [c._id.toString(), c.count as number])
    );

    const serialized = teams.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      description: t.description || null,
      captainId: t.captainId.toString(),
      myRole: membershipMap.get(t._id.toString())?.role || "player",
      memberCount: countMap.get(t._id.toString()) || 0,
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({ teams: serialized });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/teams — create a new team
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const result = createTeamSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    await dbConnect();

    const { generateInviteCode } = await import("@/lib/teams");

    const team = await Team.create({
      name: result.data.name,
      description: result.data.description,
      captainId: user.id,
      inviteCode: generateInviteCode(),
    });

    // Add the creator as captain
    await TeamMember.create({
      teamId: team._id,
      userId: user.id,
      role: "captain",
    });

    return NextResponse.json(
      {
        message: "Team created successfully",
        team: {
          id: team._id.toString(),
          name: team.name,
          description: team.description || null,
          captainId: team.captainId.toString(),
          createdAt: team.createdAt.toISOString(),
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
