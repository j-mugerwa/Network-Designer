const mongoose = require("mongoose");

const templateSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  key: {
    type: String,
    required: true,
    unique: true,
  },
  contentTemplate: {
    type: String,
    required: true,
  },
  variables: [
    {
      name: String,
      description: String,
      required: Boolean,
      defaultValue: mongoose.Schema.Types.Mixed,
    },
  ],
  order: {
    type: Number,
    required: true,
  },
  conditionalLogic: {
    expression: String,
    showIf: mongoose.Schema.Types.Mixed,
  },
});

const reportTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    category: {
      type: String,
      enum: ["technical", "executive", "implementation", "custom"],
      default: "technical",
    },
    sections: [templateSectionSchema],
    supportedFormats: {
      type: [String],
      enum: ["pdf", "docx", "html", "markdown"],
      default: ["pdf"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    version: {
      type: String,
      default: "1.0",
    },
    thumbnail: String,
    styles: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

module.exports = mongoose.model("ReportTemplate", reportTemplateSchema);
