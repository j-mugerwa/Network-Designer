const mongoose = require("mongoose");
const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    }, // Monthly price
    billingPeriod: {
      type: String,
      enum: ["monthly", "annual"],
      default: "monthly",
    },
    maxDesigns: {
      type: Number,
      default: 5,
      required: true,
    },
    // The plan code from Paystack
    paystackPlanCode: {
      type: String,
      required: true,
    },
    paystackPlanId: {
      type: String,
    },
    //Feature sets.
    features: {
      maxDesigns: {
        type: Number,
        default: 5,
      },
      maxTeamMembers: {
        type: Number,
        default: 1,
      },
      advancedVisualization: {
        type: Boolean,
        default: false,
      },
      equipmentRecommendations: {
        type: Boolean,
        default: false,
      },
      configTemplates: {
        type: Boolean,
        default: false,
      },
      apiAccess: {
        type: Boolean,
        default: false,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
      exportFormats: [{ type: String }], // ['pdf', 'docx', 'csv']
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
