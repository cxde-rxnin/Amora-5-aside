import mongoose, { Document, Model, Schema } from "mongoose";

export type BookingType = "casual" | "training" | "team";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "checked-in";

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  type: BookingType;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
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
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      enum: [60, 120],
    },
    type: {
      type: String,
      enum: ["casual", "training", "team"],
      default: "casual",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "checked-in"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for conflict detection queries
bookingSchema.index({ date: 1, startTime: 1, status: 1 });
bookingSchema.index({ date: 1, status: 1 });

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", bookingSchema);

export default Booking;
