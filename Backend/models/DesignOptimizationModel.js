const mongoose = require("mongoose");

const optimizationSchema = new mongoose.Schema(
  {
    originalDesignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NetworkDesign",
      required: true,
    },
    optimizedDesignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NetworkDesign",
    },
    optimizationType: {
      type: String,
      enum: ["cost", "performance", "security", "reliability", "hybrid"],
      required: true,
    },
    improvements: [
      {
        area: {
          type: String,
          enum: [
            "bandwidth",
            "equipment",
            "topology",
            "security",
            "redundancy",
            "ip-scheme",
          ],
          required: true,
        },
        description: String,
        before: mongoose.Schema.Types.Mixed,
        after: mongoose.Schema.Types.Mixed,
        impact: {
          type: String,
          enum: ["high", "medium", "low"],
        },
        estimatedSavings: Number,
        implementationComplexity: {
          type: String,
          enum: ["low", "medium", "high"],
        },
      },
    ],
    metrics: {
      costReduction: Number,
      performanceImprovement: Number,
      securityImprovement: Number,
      reliabilityImprovement: Number,
    },
    status: {
      type: String,
      enum: ["pending", "applied", "rejected"],
      default: "pending",
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appliedAt: Date,
    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for optimization report
optimizationSchema.virtual("report", {
  ref: "NetworkReport",
  localField: "_id",
  foreignField: "optimizationId",
  justOne: true,
});

module.exports = mongoose.model("DesignOptimization", optimizationSchema);
