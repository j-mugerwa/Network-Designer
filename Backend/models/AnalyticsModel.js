const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      index: true, // Add index for faster querying
      enum: [
        //Event types
        "payment_initialized",
        "payment_initialization_success",
        "payment_initialization_failed",
        "payment_verification_started",
        "payment_verification_success",
        "payment_verification_failed",
        "payment_callback_triggered",
        "payment_complete",
        "payment_timeout",
        "payment_missing_reference",
      ],
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    userAgent: {
      type: String,
      required: false,
    },
    ipAddress: {
      type: String,
      required: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "unknown",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for common query patterns
analyticsSchema.index({ event: 1, userId: 1 });
analyticsSchema.index({ createdAt: -1 });
//Automatic Data Retention for 90 days.
analyticsSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
); // 90 days

// Pre-save hook to extract additional metadata
analyticsSchema.pre("save", function (next) {
  if (!this.sessionId && this.payload?.sessionId) {
    this.sessionId = this.payload.sessionId;
  }

  if (!this.userId && this.payload?.userId) {
    this.userId = this.payload.userId;
  }

  // Simple device detection
  if (this.userAgent) {
    const ua = this.userAgent.toLowerCase();
    if (ua.match(/mobile/)) {
      this.deviceType = "mobile";
    } else if (ua.match(/tablet/)) {
      this.deviceType = "tablet";
    } else if (ua.match(/desktop/)) {
      this.deviceType = "desktop";
    }
  }

  next();
});

module.exports = mongoose.model("Analytics", analyticsSchema);
