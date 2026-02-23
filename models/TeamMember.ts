import mongoose, { Document, Model, Schema } from "mongoose";

export type MemberRole = "captain" | "player";

export interface ITeamMember extends Document {
  _id: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: MemberRole;
  jerseyNumber?: number;
  position?: string;
  createdAt: Date;
  updatedAt: Date;
}

const teamMemberSchema = new Schema<ITeamMember>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: [true, "Team ID is required"],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    role: {
      type: String,
      enum: ["captain", "player"],
      default: "player",
    },
    jerseyNumber: {
      type: Number,
      min: [1, "Jersey number must be at least 1"],
      max: [99, "Jersey number cannot exceed 99"],
    },
    position: {
      type: String,
      trim: true,
      maxlength: [30, "Position cannot exceed 30 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// A user can only be in a team once
teamMemberSchema.index({ teamId: 1, userId: 1 }, { unique: true });

const TeamMember: Model<ITeamMember> =
  mongoose.models.TeamMember ||
  mongoose.model<ITeamMember>("TeamMember", teamMemberSchema);

export default TeamMember;
