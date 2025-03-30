const mongoose = require("mongoose");

const reportTemplateSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    sections: [
      {
        title: String,
        contentTemplate: String,
        variables: [String],
      },
    ],
    supportedFormats: [String], // ['pdf', 'docx', 'html', 'markdown']
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
module.exports = mongoose.model("ReportTemplate", reportTemplateSchema);

// Extend the existing Report model
reportSchema.add({
  format: {
    type: String,
    enum: ["pdf", "docx", "html", "markdown"],
    default: "pdf",
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ReportTemplate",
  },
});
