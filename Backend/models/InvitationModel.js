// models/InvitationModel.js
const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    token: { type: String, required: true, unique: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    company: { type: String, required: true }, // Company name/id from inviter
    inviterId: { type: String, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired", "registered"],
      default: "pending",
    },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    expiresAt: { type: Date, required: true },
    registeredUserId: { type: String, ref: "User" }, // For tracking
  },
  { timestamps: true }
);

// Index for faster queries
invitationSchema.index({ email: 1, team: 1 }, { unique: true });
//invitationSchema.index({ token: 1 }, { unique: true });
invitationSchema.index({ status: 1 });
invitationSchema.index({ invitedBy: 1 });
invitationSchema.index({ team: 1 });

const Invitation = mongoose.model("Invitation", invitationSchema);

module.exports = Invitation;
