const { boolean } = require("joi");
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
        enum: [
          "trial",
          "active",
          "canceled",
          "expired",
          "past_due",
          "paused",
          "pending_payment",
        ],
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
    isFirstLogin: {
      type: Boolean,
      default: false,
    },
    loginHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LoginHistory",
      },
    ],
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

//userSchema.index({ firebaseUID: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
