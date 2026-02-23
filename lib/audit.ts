import mongoose from "mongoose";
import AuditLog, { AuditEntityType } from "@/models/AuditLog";
import dbConnect from "@/lib/mongodb";

/**
 * Log an admin action to the audit trail.
 * Never throws — failures are silently swallowed so they never break the
 * primary operation being audited.
 */
export async function logAdminAction(
  adminId: string | mongoose.Types.ObjectId,
  action: string,
  entityType: AuditEntityType,
  entityId: string | mongoose.Types.ObjectId,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    await dbConnect();
    await AuditLog.create({
      adminId: new mongoose.Types.ObjectId(adminId.toString()),
      action,
      entityType,
      entityId: new mongoose.Types.ObjectId(entityId.toString()),
      metadata,
    });
  } catch {
    // Intentionally silent — audit failures must never block business logic
  }
}
