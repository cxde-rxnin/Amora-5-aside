import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { logAdminAction } from "@/lib/audit";

const CANCELLATION_WINDOW_HOURS = 6;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await dbConnect();

    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Only the owner or an admin can modify a booking
    if (booking.userId.toString() !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Users can only cancel; admins can change status
    if (user.role !== "admin" && body.status !== "cancelled") {
      return NextResponse.json(
        { error: "You can only cancel your bookings" },
        { status: 403 }
      );
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    // Enforce cancellation window for non-admins
    if (user.role !== "admin" && body.status === "cancelled") {
      const [hours, minutes] = booking.startTime.split(":").map(Number);
      const bookingStart = new Date(booking.date);
      bookingStart.setHours(hours, minutes ?? 0, 0, 0);
      const cutoff = new Date(
        bookingStart.getTime() - CANCELLATION_WINDOW_HOURS * 60 * 60 * 1000
      );
      if (new Date() > cutoff) {
        return NextResponse.json(
          {
            error: `Bookings cannot be cancelled within ${CANCELLATION_WINDOW_HOURS} hours of the start time`,
          },
          { status: 400 }
        );
      }
    }

    const previousStatus = booking.status;
    booking.status = body.status;
    await booking.save();

    // Audit admin status changes
    if (user.role === "admin") {
      await logAdminAction(user.id, "update_booking_status", "booking", booking._id, {
        previousStatus,
        newStatus: body.status,
      });
    }

    return NextResponse.json({
      message: "Booking updated",
      booking: {
        id: booking._id.toString(),
        date: booking.date.toISOString(),
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: booking.duration,
        type: booking.type,
        status: booking.status,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
