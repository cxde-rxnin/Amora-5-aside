import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import BlockedSlot from "@/models/BlockedSlot";
import { getAllSlots, parseHour } from "@/lib/slots";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startParam = searchParams.get("start"); // e.g. 2026-02-01
        const endParam = searchParams.get("end");     // e.g. 2026-03-31

        if (!startParam || !endParam) {
            return NextResponse.json(
                { error: "start and end parameters are required" },
                { status: 400 }
            );
        }

        const startDate = new Date(startParam);
        const endDate = new Date(endParam);

        await dbConnect();

        // Find all bookings and blocked slots in this range
        const [bookings, blockedSlots] = await Promise.all([
            Booking.find({
                date: { $gte: startDate, $lte: endDate },
                status: { $ne: "cancelled" },
            }).select("date startTime endTime duration").lean(),
            BlockedSlot.find({
                date: { $gte: startDate, $lte: endDate },
            }).select("date startTime endTime").lean(),
        ]);

        const allSlots = getAllSlots();
        const totalSlotsPerDay = allSlots.length;

        // Group occupied slots by date
        const occupiedByDate = new Map<string, Set<string>>();

        for (const b of bookings) {
            const d = b.date.toISOString().split("T")[0];
            if (!occupiedByDate.has(d)) occupiedByDate.set(d, new Set());
            const set = occupiedByDate.get(d)!;

            const start = parseHour(b.startTime);
            const end = parseHour(b.endTime);
            for (let h = start; h < end; h++) {
                set.add(`${h.toString().padStart(2, "0")}:00`);
            }
        }

        for (const b of blockedSlots) {
            const d = b.date.toISOString().split("T")[0];
            if (!occupiedByDate.has(d)) occupiedByDate.set(d, new Set());
            const set = occupiedByDate.get(d)!;

            const start = parseHour(b.startTime);
            const end = parseHour(b.endTime);
            for (let h = start; h < end; h++) {
                set.add(`${h.toString().padStart(2, "0")}:00`);
            }
        }

        // A date is fully unavailable if the number of occupied hours >= total operating hours
        const unavailableDates: string[] = [];
        for (const [dateStr, set] of occupiedByDate.entries()) {
            if (set.size >= totalSlotsPerDay) {
                unavailableDates.push(dateStr);
            }
        }

        return NextResponse.json({ unavailableDates });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
