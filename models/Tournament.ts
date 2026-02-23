import mongoose, { Document, Model, Schema } from "mongoose";

export type TournamentStatus = "draft" | "open" | "ongoing" | "completed";

export interface ITournament extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  bannerImage?: string;
  format: string;
  maxTeams: number;
  squadSizeLimit: number;
  entryFee: number;
  registrationOpen: Date;
  registrationClose: Date;
  status: TournamentStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const tournamentSchema = new Schema<ITournament>(
  {
    name: {
      type: String,
      required: [true, "Tournament name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    bannerImage: {
      type: String,
      trim: true,
    },
    format: {
      type: String,
      required: [true, "Format is required"],
      trim: true,
    },
    maxTeams: {
      type: Number,
      required: [true, "Max teams is required"],
      min: [2, "Must allow at least 2 teams"],
    },
    squadSizeLimit: {
      type: Number,
      required: [true, "Squad size limit is required"],
      min: [1, "Squad size must be at least 1"],
    },
    entryFee: {
      type: Number,
      default: 0,
      min: [0, "Entry fee cannot be negative"],
    },
    registrationOpen: {
      type: Date,
      required: [true, "Registration open date is required"],
    },
    registrationClose: {
      type: Date,
      required: [true, "Registration close date is required"],
    },
    status: {
      type: String,
      enum: ["draft", "open", "ongoing", "completed"],
      default: "draft",
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

tournamentSchema.index({ status: 1 });
tournamentSchema.index({ registrationOpen: 1 });
tournamentSchema.index({ registrationClose: 1 });

const Tournament: Model<ITournament> =
  mongoose.models.Tournament ||
  mongoose.model<ITournament>("Tournament", tournamentSchema);

export default Tournament;
