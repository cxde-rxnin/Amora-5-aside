import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/getCurrentUser";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    await dbConnect();

    // Build query
    let teamIds: string[] | null = null;

    if (search) {
      // Search by team name or captain name/email
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      })
        .select("_id")
        .lean();

      const userIds = matchingUsers.map((u) => u._id);

      const teamsFromName = await Team.find({
        name: { $regex: search, $options: "i" },
      })
        .select("_id")
        .lean();

      const teamsFromCaptain = await Team.find({
        captainId: { $in: userIds },
      })
        .select("_id")
        .lean();

      const allIds = new Set([
        ...teamsFromName.map((t) => t._id.toString()),
        ...teamsFromCaptain.map((t) => t._id.toString()),
      ]);

      teamIds = Array.from(allIds);
    }

    const query = teamIds ? { _id: { $in: teamIds } } : {};
    const teams = await Team.find(query)
      .sort({ createdAt: -1 })
      .populate("captainId", "name email")
      .lean();

    // Get member counts
    const teamIdList = teams.map((t) => t._id);
    const memberCounts = await TeamMember.aggregate([
      { $match: { teamId: { $in: teamIdList } } },
      { $group: { _id: "$teamId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(
      memberCounts.map((m) => [m._id.toString(), m.count])
    );

    const serialized = teams.map((t) => {
      const captain = t.captainId as unknown as {
        _id: { toString(): string };
        name: string;
        email: string;
      } | null;

      return {
        id: t._id.toString(),
        name: t.name,
        description: t.description ?? null,
        captainName: captain?.name ?? "Unknown",
        captainEmail: captain?.email ?? "",
        memberCount: countMap.get(t._id.toString()) ?? 0,
        createdAt: t.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ teams: serialized });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
