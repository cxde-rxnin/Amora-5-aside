import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Booking from "@/models/Booking";
import { getCurrentUser } from "@/lib/getCurrentUser";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const txRef = searchParams.get("tx_ref");

    if (!txRef) {
      return NextResponse.json(
        { error: "Transaction reference is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const payment = await Payment.findOne({ txRef }).lean();

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Only the payment owner or admin can verify
    if (payment.userId.toString() !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const booking = await Booking.findById(payment.bookingId).lean();

    return NextResponse.json({
      payment: {
        id: payment._id.toString(),
        txRef: payment.txRef,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt.toISOString(),
      },
      booking: booking
        ? {
            id: booking._id.toString(),
            date: booking.date.toISOString(),
            startTime: booking.startTime,
            endTime: booking.endTime,
            duration: booking.duration,
            type: booking.type,
            status: booking.status,
          }
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
