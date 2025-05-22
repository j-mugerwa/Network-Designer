// models/InvitationModel.js
const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    role: {
      type: String,
      enum: ["member", "admin", "viewer"],
      default: "member",
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "expired"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
invitationSchema.index({ email: 1, team: 1 }, { unique: true });
//invitationSchema.index({ token: 1 }, { unique: true });
invitationSchema.index({ status: 1 });
invitationSchema.index({ invitedBy: 1 });

const Invitation = mongoose.model("Invitation", invitationSchema);

module.exports = Invitation;
