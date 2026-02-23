import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import BlockedSlot from "@/models/BlockedSlot";
import User from "@/models/User";
import Payment from "@/models/Payment";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { adminCreateBookingSchema } from "@/lib/validations/booking";
import {
  normalizeDate,
  isWithinOperatingHours,
  calculateEndTime,
  getOccupiedSlots,
} from "@/lib/slots";
import { logAdminAction } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const statusParam = searchParams.get("status");
    const searchParam = searchParams.get("search");

    await dbConnect();

    const query: Record<string, unknown> = {};

    if (dateParam) {
      query.date = normalizeDate(dateParam);
    }

    if (searchParam) {
      const users = await User.find({
        $or: [
          { name: { $regex: searchParam, $options: "i" } },
          { email: { $regex: searchParam, $options: "i" } },
        ],
      }).select("_id").lean();

      const userIds = users.map((u) => u._id);
      query.userId = { $in: userIds };
    }

    if (statusParam && ["pending", "confirmed", "cancelled", "checked-in"].includes(statusParam)) {
      query.status = statusParam;
    }

    const bookings = await Booking.find(query)
      .sort({ date: -1, startTime: -1 })
      .populate("userId", "name email phone")
      .lean();

    // Fetch payments for these bookings
    const bookingIds = bookings.map((b) => b._id);
    const payments = await Payment.find({
      bookingId: { $in: bookingIds },
      status: { $in: ["pending", "successful"] },
    }).lean();

    const paymentMap = new Map();
    for (const p of payments) {
      if (p.bookingId) {
        const id = p.bookingId.toString();
        // If we already mapped a successful payment, don't overwrite with a pending one
        if (paymentMap.has(id) && paymentMap.get(id).status === "successful") {
          continue;
        }
        paymentMap.set(id, p);
      }
    }

    const serialized = bookings.map((b) => {
      const payment = paymentMap.get(b._id.toString());

      let finalStatus = b.status;
      // Override status to confirmed if there's a successful payment and it's currently pending
      if (finalStatus === "pending" && payment?.status === "successful") {
        finalStatus = "confirmed";
      }

      const u = b.userId as unknown as {
        _id: { toString(): string };
        name: string;
        email: string;
        phone?: string;
      } | null;
      return {
        id: b._id.toString(),
        user: u
          ? {
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            phone: u.phone,
          }
          : null,
        date: b.date.toISOString(),
        startTime: b.startTime,
        endTime: b.endTime,
        duration: b.duration,
        type: b.type,
        status: finalStatus,
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
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = adminCreateBookingSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    const { userId, date, startTime, duration, type, status } = result.data;
    const normalizedDate = normalizeDate(date);

    if (!isWithinOperatingHours(startTime, duration)) {
      return NextResponse.json(
        { error: "Booking must be within operating hours (08:00 – 23:00)" },
        { status: 400 }
      );
    }

    const endTime = calculateEndTime(startTime, duration);
    const slotsNeeded = getOccupiedSlots(startTime, duration);

    await dbConnect();

    // Verify user exists
    const targetUser = await User.findById(userId).lean();
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check conflicts
    const conflict = await Booking.findOne({
      date: normalizedDate,
      status: { $ne: "cancelled" },
      $or: slotsNeeded.map((slot) => ({
        startTime: { $lte: slot },
        endTime: { $gt: slot },
      })),
    }).lean();

    if (conflict) {
      return NextResponse.json(
        { error: "Time slot conflict exists" },
        { status: 409 }
      );
    }

    const blockedConflict = await BlockedSlot.findOne({
      date: normalizedDate,
      $or: slotsNeeded.map((slot) => ({
        startTime: { $lte: slot },
        endTime: { $gt: slot },
      })),
    }).lean();

    if (blockedConflict) {
      return NextResponse.json(
        { error: "Time slot is blocked" },
        { status: 409 }
      );
    }

    const booking = await Booking.create({
      userId,
      date: normalizedDate,
      startTime,
      endTime,
      duration,
      type,
      status: status || "pending",
    });

    await logAdminAction(currentUser.id, "create_booking", "booking", booking._id, {
      userId,
      date: normalizedDate.toISOString(),
      startTime,
      duration,
      type,
      status: booking.status,
    });

    return NextResponse.json(
      {
        message: "Booking created by admin",
        booking: {
          id: booking._id.toString(),
          date: booking.date.toISOString(),
          startTime: booking.startTime,
          endTime: booking.endTime,
          duration: booking.duration,
          type: booking.type,
          status: booking.status,
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
