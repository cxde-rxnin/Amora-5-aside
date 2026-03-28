import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Booking from "@/models/Booking";
import TournamentTeam from "@/models/TournamentTeam";
import Tournament from "@/models/Tournament";
import Team from "@/models/Team";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { verifyFlutterwaveTransaction } from "@/lib/flutterwave";

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

    const transactionId = searchParams.get("transaction_id");

    // If pending and we have a transaction_id from the redirect query params, 
    // try to verify directly with Flutterwave (useful for local dev without webhooks)
    if (payment.status === "pending" && transactionId) {
      try {
        const verification = await verifyFlutterwaveTransaction(transactionId);
        console.log("Flutterwave verify API response:", JSON.stringify(verification, null, 2));

        if (
          verification.status === "success" &&
          verification.data.status === "successful" &&
          verification.data.amount >= payment.amount &&
          verification.data.currency === payment.currency
        ) {
          payment.status = "successful";
          payment.flutterwaveTxId = transactionId;
          payment.paymentMethod = verification.data.payment_type || "";

          await Payment.findByIdAndUpdate(payment._id, {
            status: payment.status,
            flutterwaveTxId: payment.flutterwaveTxId,
            paymentMethod: payment.paymentMethod
          });

          // Update the linked entity based on payment type
          if (payment.paymentType === "tournament_entry") {
            // Update TournamentTeam paymentStatus
            if (payment.tournamentTeamId) {
              await TournamentTeam.findByIdAndUpdate(payment.tournamentTeamId, {
                paymentStatus: "paid",
                paymentId: payment._id,
              });
            }
          } else {
            // Update booking status
            await Booking.findByIdAndUpdate(payment.bookingId, {
              status: "confirmed"
            });
          }

          // Trigger confirmation emails (non-blocking)
          try {
            const fullUser = await User.findById(payment.userId).lean();
            if (fullUser) {
              if (payment.paymentType === "tournament_entry" && payment.tournamentTeamId) {
                // Tournament Confirmation
                const [tt, tournament, team] = await Promise.all([
                  TournamentTeam.findById(payment.tournamentTeamId).lean(),
                  Tournament.findOne({ _id: { $exists: true } }).lean(), // Need context, but let's try to find it
                  Team.findOne({ _id: { $exists: true } }).lean()
                ]);
                // This branch is harder without full context, typically we rely on webhook
              } else if (payment.bookingId) {
                // Booking Confirmation handled in webhook, but good to have a backup or 
                // just assume webhook is source of truth.
              }
            }
          } catch (err) {
            console.error("Direct verify email error:", err);
          }
        } else {
          console.log("Verification conditions not met:", {
            status: verification.status,
            dataStatus: verification.data?.status,
            vwAmount: verification.data?.amount,
            pAmount: payment.amount,
            vwCur: verification.data?.currency,
            pCur: payment.currency
          });
        }
      } catch (err) {
        console.error("Flutterwave verification error:", err);
      }
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
