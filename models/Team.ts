import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITeam extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  captainId: mongoose.Types.ObjectId;
  logo?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      maxlength: [50, "Team name cannot exceed 50 characters"],
    },
    captainId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Captain is required"],
      index: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
    },
  },
  {
    timestamps: true,
  }
);

teamSchema.index({ name: 1 });

const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>("Team", teamSchema);

export default Team;
