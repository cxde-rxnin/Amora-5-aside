import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { sendTeamJoinEmail } from "@/lib/email";

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ inviteCode: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { inviteCode } = await params;
        await dbConnect();

        const team = await Team.findOne({ inviteCode: inviteCode.toUpperCase() });
        if (!team) {
            return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
        }

        // Check if already a member
        const existingMember = await TeamMember.findOne({
            teamId: team._id,
            userId: user.id,
        });

        if (existingMember) {
            return NextResponse.json(
                { error: "You are already a member of this team", teamId: team._id },
                { status: 400 }
            );
        }

        // Add as player
        await TeamMember.create({
            teamId: team._id,
            userId: user.id,
            role: "player",
        });

        // Notify captain (non-blocking)
        try {
            const captain = await User.findById(team.captainId).lean();
            if (captain) {
                sendTeamJoinEmail({
                    to: captain.email,
                    playerName: user.name,
                    teamName: team.name,
                    captainName: captain.name,
                }).catch(console.error);
            }
        } catch (err) {
            console.error("Team join email error:", err);
        }

        return NextResponse.json({
            message: "Successfully joined the team",
            teamId: team._id.toString(),
            teamName: team.name,
        });
    } catch (error) {
        console.error("Join team error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
