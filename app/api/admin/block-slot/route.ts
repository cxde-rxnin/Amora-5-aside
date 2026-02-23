import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import BlockedSlot from "@/models/BlockedSlot";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { blockSlotSchema } from "@/lib/validations/booking";
import { normalizeDate, parseHour } from "@/lib/slots";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    await dbConnect();

    const query: Record<string, unknown> = {};
    if (dateParam) {
      query.date = normalizeDate(dateParam);
    }

    const slots = await BlockedSlot.find(query)
      .sort({ date: -1, startTime: 1 })
      .populate("createdBy", "name email")
      .lean();

    const serialized = slots.map((s) => {
      const admin = s.createdBy as unknown as {
        _id: { toString(): string };
        name: string;
        email: string;
      } | null;
      return {
        id: s._id.toString(),
        date: s.date.toISOString(),
        startTime: s.startTime,
        endTime: s.endTime,
        reason: s.reason,
        createdBy: admin
          ? { id: admin._id.toString(), name: admin.name, email: admin.email }
          : null,
        createdAt: s.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ blockedSlots: serialized });
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
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = blockSlotSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    const { date, startTime, endTime, reason } = result.data;
    const normalizedDate = normalizeDate(date);

    const startHour = parseHour(startTime);
    const endHour = parseHour(endTime);

    if (endHour <= startHour) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    if (startHour < 8 || endHour > 23) {
      return NextResponse.json(
        { error: "Slot must be within operating hours (08:00 – 23:00)" },
        { status: 400 }
      );
    }

    await dbConnect();

    const blockedSlot = await BlockedSlot.create({
      date: normalizedDate,
      startTime,
      endTime,
      reason,
      createdBy: user.id,
    });

    return NextResponse.json(
      {
        message: "Slot blocked successfully",
        blockedSlot: {
          id: blockedSlot._id.toString(),
          date: blockedSlot.date.toISOString(),
          startTime: blockedSlot.startTime,
          endTime: blockedSlot.endTime,
          reason: blockedSlot.reason,
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

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Blocked slot ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const deleted = await BlockedSlot.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Blocked slot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Blocked slot removed" });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
