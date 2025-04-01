const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUID: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
    },
    subscription: {
      planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubscriptionPlan",
      },
      status: {
        type: String,
        enum: ["active", "canceled", "expired", "past_due", "paused"],
        default: "active",
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: {
        type: Date,
      },
      renewal: {
        type: Boolean,
        default: true,
      },
      paymentMethodId: {
        type: String,
      },
      paystackSubscriptionCode: {
        type: String,
      },
      paystackCustomerCode: {
        type: String,
      },
      lastPaymentDate: {
        type: Date,
      },
      nextPaymentDate: {
        type: Date,
      },
    },
    trial: {
      used: {
        type: Boolean,
        default: false,
      },
      expiresAt: {
        type: Date,
      },
    },
    company: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "network-admin", "user"],
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("User", userSchema);
