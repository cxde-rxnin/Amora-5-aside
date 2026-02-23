import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import Tournament from "@/models/Tournament";
import TournamentTeam from "@/models/TournamentTeam";
import Match from "@/models/Match";
import MatchEvent from "@/models/MatchEvent";
import { getCurrentUser } from "@/lib/getCurrentUser";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all aggregations in parallel
    const [
      revenueAgg,
      monthlyRevenueAgg,
      revenueByTypeAgg,
      totalBookings,
      monthlyBookings,
      peakHourAgg,
      mostBookedDayAgg,
      cancelledBookings,
      totalTournaments,
      tournamentsByStatus,
      totalRegistrations,
      paidRegistrations,
      totalMatches,
      completedMatches,
      totalGoals,
      totalCards,
    ] = await Promise.all([
      // Total confirmed revenue
      Payment.aggregate([
        { $match: { status: "successful" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      // This month's revenue
      Payment.aggregate([
        { $match: { status: "successful", createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      // Revenue by payment type
      Payment.aggregate([
        { $match: { status: "successful" } },
        {
          $group: {
            _id: "$paymentType",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Total bookings
      Booking.countDocuments({}),

      // This month's bookings
      Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),

      // Peak booking hour
      Booking.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: "$startTime", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),

      // Most booked day of week (0=Sun … 6=Sat)
      Booking.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: { $dayOfWeek: "$date" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),

      // Cancelled bookings
      Booking.countDocuments({ status: "cancelled" }),

      // Total tournaments
      Tournament.countDocuments({}),

      // Tournaments by status
      Tournament.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Total team registrations
      TournamentTeam.countDocuments({}),

      // Paid registrations
      TournamentTeam.countDocuments({ paymentStatus: { $in: ["paid", "free"] } }),

      // Total matches
      Match.countDocuments({}),

      // Completed matches
      Match.countDocuments({ status: "completed" }),

      // Total goals
      MatchEvent.countDocuments({ type: "goal" }),

      // Total cards (yellow + red)
      MatchEvent.countDocuments({ type: { $in: ["yellow", "red"] } }),
    ]);

    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const revenueByType: Record<string, { total: number; count: number }> = {};
    for (const r of revenueByTypeAgg) {
      revenueByType[r._id as string] = { total: r.total, count: r.count };
    }

    const tournamentStatusMap: Record<string, number> = {};
    for (const t of tournamentsByStatus) {
      tournamentStatusMap[t._id as string] = t.count;
    }

    return NextResponse.json({
      revenue: {
        total: revenueAgg[0]?.total ?? 0,
        thisMonth: monthlyRevenueAgg[0]?.total ?? 0,
        byType: revenueByType,
      },
      bookings: {
        total: totalBookings,
        thisMonth: monthlyBookings,
        cancelled: cancelledBookings,
        peakHour: peakHourAgg[0]?._id ?? null,
        mostBookedDay:
          mostBookedDayAgg[0]?._id != null
            ? DAY_NAMES[(mostBookedDayAgg[0]._id as number) - 1] ?? null
            : null,
      },
      tournaments: {
        total: totalTournaments,
        byStatus: tournamentStatusMap,
        totalRegistrations,
        paidRegistrations,
      },
      matches: {
        total: totalMatches,
        completed: completedMatches,
        totalGoals,
        totalCards,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
