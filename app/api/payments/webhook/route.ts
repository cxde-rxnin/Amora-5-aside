import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Booking from "@/models/Booking";
import TournamentTeam from "@/models/TournamentTeam";
import User from "@/models/User";
import {
  verifyWebhookSignature,
  verifyFlutterwaveTransaction,
} from "@/lib/flutterwave";
import { sendBookingConfirmation } from "@/lib/email";

const WEBHOOK_SECRET = process.env.FLUTTERWAVE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    // Step 1: Verify webhook signature
    const signature = request.headers.get("verif-hash");

    if (!verifyWebhookSignature(WEBHOOK_SECRET, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = await request.json();
    const { data } = body;

    if (!data || !data.id) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const txRef: string = data.tx_ref;
    const flwTransactionId: string = data.id.toString();

    await dbConnect();

    // Step 2: Find the payment record
    const payment = await Payment.findOne({ txRef });

    if (!payment) {
      // Unknown transaction reference — return 200 to acknowledge receipt
      return NextResponse.json({ status: "ok" });
    }

    // Idempotency: if already processed, recover partial failures before returning
    if (payment.status === "successful") {
      if (payment.paymentType === "tournament_entry" && payment.tournamentTeamId) {
        const tt = await TournamentTeam.findById(payment.tournamentTeamId);
        if (tt && tt.paymentStatus === "pending") {
          tt.paymentStatus = "paid";
          tt.paymentId = payment._id;
          await tt.save();
        }
      }
      return NextResponse.json({ status: "ok" });
    }

    // Step 3: Verify the transaction with Flutterwave API (source of truth)
    const verification = await verifyFlutterwaveTransaction(flwTransactionId);

    if (
      verification.status !== "success" ||
      verification.data.status !== "successful"
    ) {
      // Transaction not successful
      payment.status = "failed";
      payment.flutterwaveTxId = flwTransactionId;
      await payment.save();

      return NextResponse.json({ status: "ok" });
    }

    // Step 4: Validate amount and currency match
    if (
      verification.data.amount < payment.amount ||
      verification.data.currency !== payment.currency
    ) {
      payment.status = "failed";
      payment.flutterwaveTxId = flwTransactionId;
      await payment.save();

      return NextResponse.json({ status: "ok" });
    }

    // Step 5: Mark payment as successful
    payment.status = "successful";
    payment.flutterwaveTxId = flwTransactionId;
    payment.paymentMethod = verification.data.payment_type || "";
    await payment.save();

    // Step 6: Branch on payment type
    if (payment.paymentType === "tournament_entry") {
      // Handle tournament entry payment
      if (payment.tournamentTeamId) {
        const tournamentTeam = await TournamentTeam.findById(
          payment.tournamentTeamId
        );
        if (tournamentTeam && tournamentTeam.paymentStatus === "pending") {
          tournamentTeam.paymentStatus = "paid";
          tournamentTeam.paymentId = payment._id;
          await tournamentTeam.save();
        }
      }
    } else {
      // Existing booking flow
      const booking = await Booking.findById(payment.bookingId);
      if (booking && booking.status === "pending") {
        booking.status = "confirmed";
        await booking.save();
      }

      // Step 7: Send confirmation email (non-blocking)
      if (booking) {
        const user = await User.findById(payment.userId).lean();
        if (user) {
          sendBookingConfirmation({
            to: user.email,
            customerName: user.name,
            bookingDate: booking.date.toISOString(),
            startTime: booking.startTime,
            endTime: booking.endTime,
            duration: booking.duration,
            txRef: payment.txRef,
            amount: payment.amount,
          }).catch(() => {
            // Silently ignore email failures
          });
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch {
    // Always return 200 to Flutterwave to prevent retries on internal errors
    return NextResponse.json({ status: "ok" });
  }
}
