const mongoose = require("mongoose");
const optimizationSchema = new mongoose.Schema(
  {
    originalDesignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NetworkDesign",
      required: true,
    },
    optimizedDesign: mongoose.Schema.Types.Mixed,
    improvements: [
      {
        area: String,
        before: String,
        after: String,
        impact: String,
      },
    ],
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
module.exports = mongoose.model("DesignOptimization", optimizationSchema);
