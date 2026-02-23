import mongoose, { Document, Model, Schema } from "mongoose";

export type PaymentStatus = "pending" | "successful" | "failed";

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  tournamentTeamId?: mongoose.Types.ObjectId;
  paymentType: "booking" | "tournament_entry";
  txRef: string;
  flutterwaveTxId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      index: true,
    },
    tournamentTeamId: {
      type: Schema.Types.ObjectId,
      ref: "TournamentTeam",
      index: true,
    },
    paymentType: {
      type: String,
      enum: ["booking", "tournament_entry"],
      default: "booking",
    },
    txRef: {
      type: String,
      required: [true, "Transaction reference is required"],
      unique: true,
    },
    flutterwaveTxId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be positive"],
    },
    currency: {
      type: String,
      default: "NGN",
    },
    status: {
      type: String,
      enum: ["pending", "successful", "failed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ txRef: 1 }, { unique: true });

const Payment: Model<IPayment> =
  mongoose.models.Payment ||
  mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;
