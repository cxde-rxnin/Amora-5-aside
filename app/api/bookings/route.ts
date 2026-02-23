import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import BlockedSlot from "@/models/BlockedSlot";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { createBookingSchema } from "@/lib/validations/booking";
import {
  normalizeDate,
  isFutureOrToday,
  isWithinOperatingHours,
  calculateEndTime,
  getOccupiedSlots,
} from "@/lib/slots";
import { calculateBookingAmount } from "@/lib/flutterwave";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await dbConnect();

    const bookings = await Booking.find({ userId: user.id })
      .sort({ date: -1, startTime: -1 })
      .lean();

    // Fetch payments for these bookings
    const bookingIds = bookings.map((b) => b._id);
    const payments = await Payment.find({
      bookingId: { $in: bookingIds },
      status: { $in: ["pending", "successful"] },
    }).lean();

    const paymentMap = new Map(
      payments
        .filter((p) => p.bookingId != null)
        .map((p) => [p.bookingId!.toString(), p])
    );

    const serialized = bookings.map((b) => {
      const payment = paymentMap.get(b._id.toString());
      return {
        id: b._id.toString(),
        date: b.date.toISOString(),
        startTime: b.startTime,
        endTime: b.endTime,
        duration: b.duration,
        type: b.type,
        status: b.status,
        amount: calculateBookingAmount(b.startTime, b.duration),
        paymentStatus: payment?.status || null,
        txRef: payment?.txRef || null,
        createdAt: b.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ bookings: serialized });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const result = createBookingSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    const { date, startTime, duration, type } = result.data;
    const normalizedDate = normalizeDate(date);

    // Validate: not in the past
    if (!isFutureOrToday(normalizedDate)) {
      return NextResponse.json(
        { error: "Cannot book for a past date" },
        { status: 400 }
      );
    }

    // Validate: within operating hours
    if (!isWithinOperatingHours(startTime, duration)) {
      return NextResponse.json(
        { error: "Booking must be within operating hours (08:00 – 23:00)" },
        { status: 400 }
      );
    }

    const endTime = calculateEndTime(startTime, duration);
    const slotsNeeded = getOccupiedSlots(startTime, duration);

    await dbConnect();

    // Check for conflicts: overlapping bookings (not cancelled)
    const conflictingBookings = await Booking.findOne({
      date: normalizedDate,
      status: { $ne: "cancelled" },
      $or: slotsNeeded.map((slot) => ({
        startTime: { $lte: slot },
        endTime: { $gt: slot },
      })),
    }).lean();

    if (conflictingBookings) {
      return NextResponse.json(
        { error: "This time slot is already booked. Please choose another." },
        { status: 409 }
      );
    }

    // Check for blocked slots
    const conflictingBlocked = await BlockedSlot.findOne({
      date: normalizedDate,
      $or: slotsNeeded.map((slot) => ({
        startTime: { $lte: slot },
        endTime: { $gt: slot },
      })),
    }).lean();

    if (conflictingBlocked) {
      return NextResponse.json(
        { error: "This time slot is blocked by an admin." },
        { status: 409 }
      );
    }

    // Create booking
    const booking = await Booking.create({
      userId: user.id,
      date: normalizedDate,
      startTime,
      endTime,
      duration,
      type,
      status: "pending",
    });

    return NextResponse.json(
      {
        message: "Booking created successfully",
        booking: {
          id: booking._id.toString(),
          date: booking.date.toISOString(),
          startTime: booking.startTime,
          endTime: booking.endTime,
          duration: booking.duration,
          type: booking.type,
          status: booking.status,
          createdAt: booking.createdAt.toISOString(),
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
