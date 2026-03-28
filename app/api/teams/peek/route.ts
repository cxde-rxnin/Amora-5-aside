import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Team from "@/models/Team";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
        }

        await dbConnect();

        const team = await Team.findOne({ inviteCode: code.toUpperCase() }).lean();
        if (!team) {
            return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
        }

        return NextResponse.json({
            team: {
                id: team._id.toString(),
                name: team.name,
                description: team.description || null,
            },
        });
    } catch (error) {
        console.error("Peek team error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
