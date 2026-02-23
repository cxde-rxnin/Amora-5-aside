import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import BlockedSlot from "@/models/BlockedSlot";
import {
  getAllSlots,
  normalizeDate,
  isFutureOrToday,
  parseHour,
} from "@/lib/slots";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    const date = normalizeDate(dateParam);

    if (!isFutureOrToday(date)) {
      return NextResponse.json(
        { error: "Cannot check availability for past dates" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Fetch active bookings and blocked slots for this date in parallel
    const [bookings, blockedSlots] = await Promise.all([
      Booking.find({
        date,
        status: { $ne: "cancelled" },
      })
        .select("startTime endTime")
        .lean(),
      BlockedSlot.find({ date }).select("startTime endTime").lean(),
    ]);

    // Collect all occupied hours
    const occupiedHours = new Set<string>();

    for (const booking of bookings) {
      const start = parseHour(booking.startTime);
      const end = parseHour(booking.endTime);
      for (let h = start; h < end; h++) {
        occupiedHours.add(`${h.toString().padStart(2, "0")}:00`);
      }
    }

    for (const blocked of blockedSlots) {
      const start = parseHour(blocked.startTime);
      const end = parseHour(blocked.endTime);
      for (let h = start; h < end; h++) {
        occupiedHours.add(`${h.toString().padStart(2, "0")}:00`);
      }
    }

    const allSlots = getAllSlots();
    const available = allSlots.filter((slot) => !occupiedHours.has(slot));

    return NextResponse.json({
      date: date.toISOString(),
      slots: allSlots.map((slot) => ({
        time: slot,
        available: !occupiedHours.has(slot),
      })),
      available,
      occupied: Array.from(occupiedHours),
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
