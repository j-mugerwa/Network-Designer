const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NetworkDesign",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportType: {
      type: String,
      enum: ["full", "summary", "ip-scheme", "equipment"],
    },
    content: { type: mongoose.Schema.Types.Mixed }, // Flexible structure for different report types
    generatedAt: { type: Date, default: Date.now },
    downloadUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
