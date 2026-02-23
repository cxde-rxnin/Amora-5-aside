import mongoose, { Document, Model, Schema } from "mongoose";

export type MatchStatus = "scheduled" | "completed";

export interface IMatch extends Document {
  _id: mongoose.Types.ObjectId;
  tournamentId: mongoose.Types.ObjectId;
  homeTeamId: mongoose.Types.ObjectId;
  awayTeamId: mongoose.Types.ObjectId;
  round: string;
  matchDate?: Date;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  winnerTeamId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<IMatch>(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    homeTeamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    awayTeamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    round: {
      type: String,
      required: true,
      trim: true,
    },
    matchDate: {
      type: Date,
    },
    homeScore: {
      type: Number,
      default: 0,
      min: [0, "Score cannot be negative"],
    },
    awayScore: {
      type: Number,
      default: 0,
      min: [0, "Score cannot be negative"],
    },
    status: {
      type: String,
      enum: ["scheduled", "completed"],
      default: "scheduled",
    },
    winnerTeamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
    },
  },
  {
    timestamps: true,
  }
);

matchSchema.index({ status: 1 });

const Match: Model<IMatch> =
  mongoose.models.Match || mongoose.model<IMatch>("Match", matchSchema);

export default Match;
