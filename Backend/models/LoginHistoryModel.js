// models/LoginHistory.js
const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    location: {
      country: String,
      region: String,
      city: String,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
loginHistorySchema.index({ userId: 1 });
loginHistorySchema.index({ createdAt: -1 });

const LoginHistory = mongoose.model("LoginHistory", loginHistorySchema);

module.exports = LoginHistory;
