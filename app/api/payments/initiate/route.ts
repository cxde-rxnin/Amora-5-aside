import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { initiatePaymentSchema } from "@/lib/validations/payment";
import {
  generateTxRef,
  calculateBookingAmount,
  initiateFlutterwavePayment,
} from "@/lib/flutterwave";
import { paymentLimiter } from "@/lib/rateLimit";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const limit = paymentLimiter.check(`payment:${user.id}`);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many payment attempts. Please wait before trying again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = initiatePaymentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { bookingId } = result.data;

    await dbConnect();

    // Fetch booking and verify ownership
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.userId.toString() !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot pay for a ${booking.status} booking` },
        { status: 400 }
      );
    }

    // Check if there's already a pending or successful payment for this booking
    const existingPayment = await Payment.findOne({
      bookingId,
      status: { $in: ["pending", "successful"] },
    });

    if (existingPayment?.status === "successful") {
      return NextResponse.json(
        { error: "This booking has already been paid for" },
        { status: 400 }
      );
    }

    // Calculate amount
    const amount = calculateBookingAmount(booking.startTime, booking.duration);
    const txRef = generateTxRef();

    // Create payment record
    const payment = await Payment.create({
      userId: user.id,
      bookingId,
      txRef,
      amount,
      currency: "NGN",
      status: "pending",
    });

    // Initialize Flutterwave payment
    const flwResponse = await initiateFlutterwavePayment({
      tx_ref: txRef,
      amount,
      currency: "NGN",
      redirect_url: `${BASE_URL}/payment/success?tx_ref=${txRef}`,
      customer: {
        email: user.email,
        name: user.name,
        phonenumber: user.phone,
      },
      customizations: {
        title: "Amora Resort – Pitch Booking",
        description: `Pitch booking: ${booking.startTime}–${booking.endTime} on ${booking.date.toISOString().split("T")[0]}`,
      },
      meta: {
        bookingId: bookingId,
        paymentId: payment._id.toString(),
      },
    });

    if (flwResponse.status !== "success") {
      // Mark payment as failed if Flutterwave rejects the initialization
      payment.status = "failed";
      await payment.save();

      return NextResponse.json(
        { error: "Failed to initialize payment" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: "Payment initiated",
      paymentLink: flwResponse.data.link,
      txRef,
      amount,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
