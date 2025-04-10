const mongoose = require("mongoose");

const templateSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  contentTemplate: {
    type: String,
    required: true,
  },
  variables: [
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      description: String,
      required: {
        type: Boolean,
        default: false,
      },
      defaultValue: mongoose.Schema.Types.Mixed,
      type: {
        type: String,
        enum: ["string", "number", "boolean", "array", "object"],
        default: "string",
      },
    },
  ],
  order: {
    type: Number,
    required: true,
    min: 0,
  },
  conditionalLogic: {
    expression: String,
    required: {
      type: Boolean,
      default: false,
    },
    dependsOn: String,
    expectedValue: mongoose.Schema.Types.Mixed,
  },
  pageBreak: {
    type: Boolean,
    default: false,
  },
  styles: {
    titleFontSize: {
      type: Number,
      default: 16,
    },
    contentFontSize: {
      type: Number,
      default: 12,
    },
    margin: {
      type: Number,
      default: 50,
    },
  },
});

const reportTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "technical",
        "executive",
        "implementation",
        "custom",
        "compliance",
      ],
      default: "technical",
      index: true,
    },
    sections: [templateSectionSchema],
    supportedFormats: {
      type: [String],
      enum: ["pdf", "docx", "html", "markdown", "json"],
      default: ["pdf"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    version: {
      type: String,
      default: "1.0.0",
    },
    thumbnail: String,
    styles: {
      coverPage: mongoose.Schema.Types.Mixed,
      header: mongoose.Schema.Types.Mixed,
      footer: mongoose.Schema.Types.Mixed,
      table: mongoose.Schema.Types.Mixed,
    },
    metadata: {
      author: String,
      company: String,
      license: String,
      minDesignVersion: String,
    },
    tags: [String],
    isSystemTemplate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
reportTemplateSchema.index({ name: 1, category: 1, isActive: 1 });

// Virtual for template usage count
reportTemplateSchema.virtual("usageCount", {
  ref: "NetworkReport",
  localField: "_id",
  foreignField: "templateId",
  count: true,
});

// Pre-save hook for version management
reportTemplateSchema.pre("save", function (next) {
  if (this.isModified("sections") && !this.isNew) {
    const versionParts = this.version.split(".").map(Number);
    versionParts[2] += 1; // Increment patch version
    this.version = versionParts.join(".");
  }
  next();
});

module.exports = mongoose.model("ReportTemplate", reportTemplateSchema);
