const mongoose = require("mongoose");
const designPatternSchema = new mongoose.Schema(
  {
    patternName: String,
    characteristics: {
      userCount: String,
      bandwidth: String,
      segmentation: Boolean,
      cloudServices: Boolean,
    },
    optimalDesign: mongoose.Schema.Types.Mixed, // Stores successful design parameters
    successMetrics: {
      performanceScore: Number,
      costEfficiency: Number,
      implementationEase: Number,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DesignPattern", designPatternSchema);
