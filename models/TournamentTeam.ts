import mongoose, { Document, Model, Schema } from "mongoose";

export type TournamentTeamPaymentStatus = "pending" | "paid" | "free";

export interface ITournamentTeam extends Document {
  _id: mongoose.Types.ObjectId;
  tournamentId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  captainId: mongoose.Types.ObjectId;
  paymentId?: mongoose.Types.ObjectId;
  paymentStatus: TournamentTeamPaymentStatus;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const tournamentTeamSchema = new Schema<ITournamentTeam>(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },
    captainId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "free"],
      default: "pending",
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate registration of same team in same tournament
tournamentTeamSchema.index({ tournamentId: 1, teamId: 1 }, { unique: true });

const TournamentTeam: Model<ITournamentTeam> =
  mongoose.models.TournamentTeam ||
  mongoose.model<ITournamentTeam>("TournamentTeam", tournamentTeamSchema);

export default TournamentTeam;
