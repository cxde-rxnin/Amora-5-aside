import mongoose, { Document, Model, Schema } from "mongoose";

export type MatchEventType = "goal" | "assist" | "yellow" | "red";

export interface IMatchEvent extends Document {
  _id: mongoose.Types.ObjectId;
  matchId: mongoose.Types.ObjectId;
  tournamentId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  playerId: mongoose.Types.ObjectId;
  type: MatchEventType;
  minute?: number;
  createdAt: Date;
  updatedAt: Date;
}

const matchEventSchema = new Schema<IMatchEvent>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      index: true,
    },
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
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["goal", "assist", "yellow", "red"],
      required: true,
    },
    minute: {
      type: Number,
      min: [1, "Minute must be at least 1"],
      max: [120, "Minute cannot exceed 120"],
    },
  },
  {
    timestamps: true,
  }
);

const MatchEvent: Model<IMatchEvent> =
  mongoose.models.MatchEvent ||
  mongoose.model<IMatchEvent>("MatchEvent", matchEventSchema);

export default MatchEvent;
