import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBlockedSlot extends Document {
  _id: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  reason: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const blockedSlotSchema = new Schema<IBlockedSlot>(
  {
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^([01]\d|2[0-3]):00$/, "Start time must be on the hour (HH:00)"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^([01]\d|2[0-3]):00$/, "End time must be on the hour (HH:00)"],
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
      maxlength: [200, "Reason cannot exceed 200 characters"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

blockedSlotSchema.index({ date: 1, startTime: 1 });
blockedSlotSchema.index({ date: 1 });

const BlockedSlot: Model<IBlockedSlot> =
  mongoose.models.BlockedSlot ||
  mongoose.model<IBlockedSlot>("BlockedSlot", blockedSlotSchema);

export default BlockedSlot;
