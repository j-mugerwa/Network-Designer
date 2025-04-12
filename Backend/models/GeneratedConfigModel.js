const mongoose = require("mongoose");
const AppError = require("../utils/appError");

const variableValueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Variable name is required"],
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Variable value is required"],
    },
  },
  { _id: false }
);

const generatedConfigSchema = new mongoose.Schema(
  {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConfigurationTemplate",
      required: [true, "Template reference is required"],
    },
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NetworkDesign",
      required: [true, "Design reference is required"],
    },
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: [true, "Equipment reference is required"],
    },
    configType: {
      type: String,
      enum: ["basic", "vlan", "routing", "security", "qos", "ha"],
      required: [true, "Configuration type is required"],
    },
    configuration: {
      type: String,
      required: [true, "Configuration content is required"],
    },
    variableValues: {
      type: [variableValueSchema],
      required: [true, "Variable values are required"],
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Generator reference is required"],
    },
    downloadUrl: String,
    isApplied: {
      type: Boolean,
      default: false,
    },
    appliedAt: Date,
    notes: String,
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
generatedConfigSchema.index({ templateId: 1 });
generatedConfigSchema.index({ designId: 1 });
generatedConfigSchema.index({ equipmentId: 1 });
generatedConfigSchema.index({ generatedBy: 1 });
generatedConfigSchema.index({ isApplied: 1 });
generatedConfigSchema.index({ configType: 1 });

// Virtual populate
generatedConfigSchema.virtual("template", {
  ref: "ConfigurationTemplate",
  localField: "templateId",
  foreignField: "_id",
  justOne: true,
});

generatedConfigSchema.virtual("design", {
  ref: "NetworkDesign",
  localField: "designId",
  foreignField: "_id",
  justOne: true,
});

generatedConfigSchema.virtual("equipment", {
  ref: "Equipment",
  localField: "equipmentId",
  foreignField: "_id",
  justOne: true,
});

module.exports = mongoose.model(
  "GeneratedConfiguration",
  generatedConfigSchema
);
