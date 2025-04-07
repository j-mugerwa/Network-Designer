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
      enum: [
        "full",
        "summary",
        "ip-scheme",
        "equipment",
        "implementation",
        "custom",
        "professional",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    format: {
      type: String,
      enum: ["pdf", "docx", "html", "markdown", "json"],
      default: "pdf",
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReportTemplate",
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    downloadUrl: {
      type: String,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    metadata: {
      version: {
        type: String,
        default: "1.0",
      },
      generatedBy: {
        type: String,
        enum: ["system", "user"],
        default: "system",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes for better performance
reportSchema.index({ designId: 1 });
reportSchema.index({ userId: 1 });
reportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("NetworkReport", reportSchema);
