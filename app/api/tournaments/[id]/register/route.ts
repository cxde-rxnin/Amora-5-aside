import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import TournamentTeam from "@/models/TournamentTeam";
import Team from "@/models/Team";
import Payment from "@/models/Payment";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { registerTeamSchema } from "@/lib/validations/tournament";
import {
  generateTxRef,
  initiateFlutterwavePayment,
} from "@/lib/flutterwave";
import User from "@/models/User";
import mongoose from "mongoose";
import { sendTournamentRegistrationEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = registerTeamSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { teamId } = result.data;

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    await dbConnect();

    // Guard 1: Tournament exists and is open
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }
    if (tournament.status !== "open") {
      return NextResponse.json(
        { error: "Tournament is not open for registration" },
        { status: 400 }
      );
    }

    // Guard 2: Registration window
    const now = new Date();
    if (now < tournament.registrationOpen || now > tournament.registrationClose) {
      return NextResponse.json(
        { error: "Registration is not currently open" },
        { status: 400 }
      );
    }

    // Guard 3: Capacity (only count paid + free)
    const confirmedCount = await TournamentTeam.countDocuments({
      tournamentId: tournament._id,
      paymentStatus: { $in: ["paid", "free"] },
    });
    if (confirmedCount >= tournament.maxTeams) {
      return NextResponse.json(
        { error: "Tournament is full" },
        { status: 400 }
      );
    }

    // Guard 4: Requester must be captain of the team
    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    if (team.captainId.toString() !== user.id) {
      return NextResponse.json(
        { error: "You must be the captain of this team to register" },
        { status: 403 }
      );
    }

    // Guard 5: No duplicate registration
    const existing = await TournamentTeam.findOne({
      tournamentId: tournament._id,
      teamId: new mongoose.Types.ObjectId(teamId),
    });
    if (existing) {
      return NextResponse.json(
        { error: "This team is already registered for the tournament" },
        { status: 409 }
      );
    }

    // Free path
    if (tournament.entryFee === 0) {
      await TournamentTeam.create({
        tournamentId: tournament._id,
        teamId: new mongoose.Types.ObjectId(teamId),
        captainId: new mongoose.Types.ObjectId(user.id),
        paymentStatus: "free",
        registeredAt: new Date(),
      });

      // Send confirmation email (non-blocking)
      sendTournamentRegistrationEmail({
        to: user.email,
        captainName: user.name,
        teamName: team.name,
        tournamentName: tournament.name,
        entryFee: 0,
        isPaid: true,
      }).catch(console.error);

      return NextResponse.json({ registered: true, paymentRequired: false });
    }

    // Paid path
    const tournamentTeam = await TournamentTeam.create({
      tournamentId: tournament._id,
      teamId: new mongoose.Types.ObjectId(teamId),
      captainId: new mongoose.Types.ObjectId(user.id),
      paymentStatus: "pending",
      registeredAt: new Date(),
    });

    const txRef = generateTxRef();
    const payment = await Payment.create({
      userId: new mongoose.Types.ObjectId(user.id),
      tournamentTeamId: tournamentTeam._id,
      paymentType: "tournament_entry",
      txRef,
      amount: tournament.entryFee,
      currency: "NGN",
      status: "pending",
    });

    // Update TournamentTeam with paymentId
    tournamentTeam.paymentId = payment._id;
    await tournamentTeam.save();

    // Get full user for Flutterwave customer info
    const fullUser = await User.findById(user.id).lean();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const flwResponse = await initiateFlutterwavePayment({
      tx_ref: txRef,
      amount: tournament.entryFee,
      currency: "NGN",
      redirect_url: `${baseUrl}/payment/success?tx_ref=${txRef}&type=tournament`,
      customer: {
        email: user.email,
        name: user.name,
        phonenumber: fullUser?.phone,
      },
      customizations: {
        title: "Amora Tournament Entry",
        description: `${tournament.name} — ${team.name}`,
      },
    });

    // Send initiation email (non-blocking)
    sendTournamentRegistrationEmail({
      to: user.email,
      captainName: user.name,
      teamName: team.name,
      tournamentName: tournament.name,
      entryFee: tournament.entryFee,
      isPaid: false,
      paymentLink: flwResponse.data.link,
    }).catch(console.error);

    return NextResponse.json({
      registered: true,
      paymentRequired: true,
      paymentLink: flwResponse.data.link,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
