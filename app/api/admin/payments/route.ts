import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import { getCurrentUser } from "@/lib/getCurrentUser";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const dateParam = searchParams.get("date");

    await dbConnect();

    const query: Record<string, unknown> = {};

    if (
      statusParam &&
      ["pending", "successful", "failed"].includes(statusParam)
    ) {
      query.status = statusParam;
    }

    if (dateParam) {
      const start = new Date(dateParam);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(dateParam);
      end.setUTCHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .populate("userId", "name email")
      .populate("bookingId", "date startTime endTime duration")
      .lean();

    const serialized = payments.map((p) => {
      const u = p.userId as unknown as {
        _id: { toString(): string };
        name: string;
        email: string;
      } | null;
      const b = p.bookingId as unknown as {
        _id: { toString(): string };
        date: Date;
        startTime: string;
        endTime: string;
        duration: number;
      } | null;

      return {
        id: p._id.toString(),
        txRef: p.txRef,
        flutterwaveTxId: p.flutterwaveTxId,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        paymentMethod: p.paymentMethod,
        user: u
          ? { id: u._id.toString(), name: u.name, email: u.email }
          : null,
        booking: b
          ? {
              id: b._id.toString(),
              date: b.date.toISOString(),
              startTime: b.startTime,
              endTime: b.endTime,
              duration: b.duration,
            }
          : null,
        createdAt: p.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ payments: serialized });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
