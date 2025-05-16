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
        enum: ["trial", "active", "canceled", "expired", "past_due", "paused"],
        default: "trial",
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
      designCount: {
        type: Number,
        default: 0,
        min: 0,
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
      default: "admin",
    },
    lastLogin: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    lastPasswordChange: {
      type: Date,
    },
    isTrial: {
      type: Boolean,
      default: true,
    },
    trialExtensionCount: {
      type: Number,
      default: 0,
    },
    termsAccepted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("User", userSchema);
