const mongoose = require("mongoose");
const AppError = require("../utils/appError");

const configTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    equipmentType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: [true, "Equipment type is required"],
    },
    vendor: {
      type: String,
      required: [true, "Vendor is required"],
    },
    model: {
      type: String,
      required: [true, "Model is required"],
    },
    configType: {
      type: String,
      enum: ["basic", "vlan", "routing", "security", "qos", "ha"],
      required: [true, "Configuration type is required"],
    },
    template: {
      type: String,
      required: [true, "Template content is required"],
      validate: {
        validator: function (v) {
          // Validate that all variables in template are defined
          const variableMatches = v.match(/\{\{([^}]+)\}\}/g) || [];
          const definedVars = this.variables.map((v) => v.name);
          return variableMatches.every((match) => {
            const varName = match.replace(/\{\{|\}\}/g, "");
            return definedVars.includes(varName);
          });
        },
        message: "Template contains undefined variables",
      },
    },
    variables: [
      {
        name: {
          type: String,
          required: [true, "Variable name is required"],
          match: [
            /^[a-zA-Z0-9_]+$/,
            "Variable names can only contain alphanumeric characters and underscores",
          ],
        },
        description: {
          type: String,
          required: [true, "Variable description is required"],
        },
        defaultValue: String,
        required: {
          type: Boolean,
          default: false,
        },
        validationRegex: String,
        example: String,
      },
    ],
    version: {
      type: String,
      default: "1.0.0",
      match: [/^\d+\.\d+\.\d+$/, "Version must be in semantic version format"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for faster querying
configTemplateSchema.index({ equipmentType: 1, configType: 1 });
configTemplateSchema.index({ vendor: 1, model: 1 });
configTemplateSchema.index({ isActive: 1 });

module.exports = mongoose.model("ConfigurationTemplate", configTemplateSchema);
