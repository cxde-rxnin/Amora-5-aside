import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
import Tournament from "@/models/Tournament";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { generateNextKnockoutRound, isLeagueFormat } from "@/lib/fixtures";
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
        { error: "Invalid match ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { matchDate, homeScore, awayScore } = body as {
      matchDate?: string;
      homeScore?: number;
      awayScore?: number;
    };

    await dbConnect();

    const match = await Match.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Load parent tournament to check completion lock
    const tournament = await Tournament.findById(match.tournamentId);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    if (tournament.status === "completed") {
      return NextResponse.json(
        { error: "Cannot edit matches after tournament has been completed" },
        { status: 400 }
      );
    }

    // Apply matchDate update
    if (matchDate !== undefined) {
      match.matchDate = new Date(matchDate);
    }

    // Apply score update
    const hasScores =
      homeScore !== undefined && awayScore !== undefined;

    if (hasScores) {
      if (
        typeof homeScore !== "number" ||
        typeof awayScore !== "number" ||
        homeScore < 0 ||
        awayScore < 0
      ) {
        return NextResponse.json(
          { error: "Scores must be non-negative numbers" },
          { status: 400 }
        );
      }

      match.homeScore = homeScore;
      match.awayScore = awayScore;
      match.status = "completed";

      // Determine winner for knockout
      const isKnockout = !isLeagueFormat(tournament.format);
      if (isKnockout) {
        if (homeScore === awayScore) {
          return NextResponse.json(
            { error: "Knockout matches cannot end in a draw" },
            { status: 400 }
          );
        }
        match.winnerTeamId =
          homeScore > awayScore ? match.homeTeamId : match.awayTeamId;
      }
    }

    await match.save();

    if (hasScores) {
      await logAdminAction(user.id, "update_match_score", "match", match._id, {
        round: match.round,
        homeScore,
        awayScore,
        tournamentId: tournament._id.toString(),
      });
    }

    // Knockout advancement: check if this round is fully complete
    if (hasScores && !isLeagueFormat(tournament.format)) {
      const roundMatches = await Match.find({
        tournamentId: tournament._id,
        round: match.round,
      }).lean();

      const allDone = roundMatches.every((m) => m.status === "completed");

      if (allDone) {
        const winners = roundMatches.map((m) => m.winnerTeamId!);

        // If exactly one winner remains → tournament is complete
        if (winners.length === 1) {
          tournament.status = "completed";
          await tournament.save();
        } else {
          // Generate next round
          const nextMatchSpecs = generateNextKnockoutRound(
            winners,
            match.round
          );
          const nextDocs = nextMatchSpecs.map((s) => ({
            tournamentId: tournament._id,
            homeTeamId: s.homeTeamId,
            awayTeamId: s.awayTeamId,
            round: s.round,
            homeScore: 0,
            awayScore: 0,
            status: "scheduled" as const,
          }));
          await Match.insertMany(nextDocs);
        }
      }
    }

    return NextResponse.json({
      message: "Match updated",
      match: {
        id: match._id.toString(),
        round: match.round,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        status: match.status,
        matchDate: match.matchDate?.toISOString() ?? null,
        winnerTeamId: match.winnerTeamId?.toString() ?? null,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
