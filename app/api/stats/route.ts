import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
import MatchEvent from "@/models/MatchEvent";
import Team from "@/models/Team";
import User from "@/models/User";
import Tournament from "@/models/Tournament";
import mongoose from "mongoose";

export async function GET() {
    try {
        await dbConnect();

        // 1. Get all active or completed tournaments
        const tournaments = await Tournament.find({
            status: { $in: ["ongoing", "completed"] },
        }).select("_id").lean();

        const tournamentIds = tournaments.map((t) => t._id);

        // 2. Aggregate Top Scorers across all tournaments
        const topScorers = await MatchEvent.aggregate([
            {
                $match: {
                    type: "goal",
                    tournamentId: { $in: tournamentIds },
                },
            },
            {
                $group: {
                    _id: "$playerId",
                    goals: { $sum: 1 },
                    teamId: { $first: "$teamId" },
                },
            },
            { $sort: { goals: -1 } },
            { $limit: 10 },
        ]);

        // Populate scorer names and team names
        const populatedScorers = await Promise.all(
            topScorers.map(async (s) => {
                const user = await User.findById(s._id).select("name").lean();
                const team = await Team.findById(s.teamId).select("name").lean();
                return {
                    playerId: s._id.toString(),
                    playerName: user?.name || "Unknown Player",
                    teamId: s.teamId.toString(),
                    teamName: team?.name || "Unknown Team",
                    goals: s.goals,
                };
            })
        );

        // 3. Aggregate Team Stats
        const matches = await Match.find({
            tournamentId: { $in: tournamentIds },
            status: "completed",
        }).lean();

        const teamStatsMap = new Map();

        for (const m of matches) {
            const teams = [
                { id: m.homeTeamId.toString(), score: m.homeScore, oppScore: m.awayScore },
                { id: m.awayTeamId.toString(), score: m.awayScore, oppScore: m.homeScore },
            ];

            for (const t of teams) {
                if (!teamStatsMap.has(t.id)) {
                    teamStatsMap.set(t.id, {
                        teamId: t.id,
                        played: 0,
                        wins: 0,
                        draws: 0,
                        losses: 0,
                        goalsFor: 0,
                        goalsAgainst: 0,
                        points: 0,
                    });
                }

                const stats = teamStatsMap.get(t.id);
                stats.played += 1;
                stats.goalsFor += t.score;
                stats.goalsAgainst += t.oppScore;

                if (t.score > t.oppScore) {
                    stats.wins += 1;
                    stats.points += 3;
                } else if (t.score < t.oppScore) {
                    stats.losses += 1;
                } else {
                    stats.draws += 1;
                    stats.points += 1;
                }
            }
        }

        const teamLeaderboard = await Promise.all(
            Array.from(teamStatsMap.values())
                .map(async (s) => {
                    const team = await Team.findById(s.teamId).select("name").lean();
                    return {
                        ...s,
                        teamName: team?.name || "Unknown Team",
                        goalDifference: s.goalsFor - s.goalsAgainst,
                    };
                })
        );

        teamLeaderboard.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });

        return NextResponse.json({
            topScorers: populatedScorers,
            teamLeaderboard: teamLeaderboard.slice(0, 10),
        });
    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
