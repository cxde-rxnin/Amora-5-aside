import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/getCurrentUser";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const limitParam = searchParams.get("limit");
    const limit = Math.min(parseInt(limitParam ?? "100", 10), 500);

    await dbConnect();

    const query: Record<string, unknown> = {};

    if (entityType && ["booking", "tournament", "match", "payment", "team"].includes(entityType)) {
      query.entityType = entityType;
    }

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      query.createdAt = dateFilter;
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Resolve admin names
    const adminIds = [...new Set(logs.map((l) => l.adminId.toString()))];
    const admins = await User.find({
      _id: { $in: adminIds.map((id) => id) },
    })
      .select("name email")
      .lean();
    const adminMap = new Map(admins.map((a) => [a._id.toString(), { name: a.name, email: a.email }]));

    const serialized = logs.map((l) => ({
      id: l._id.toString(),
      admin: adminMap.get(l.adminId.toString()) ?? { name: "Unknown", email: "" },
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId.toString(),
      metadata: l.metadata,
      createdAt: l.createdAt.toISOString(),
    }));

    return NextResponse.json({ logs: serialized });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
