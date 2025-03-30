const mongoose = require("mongoose");

const generatedConfigSchema = new mongoose.Schema(
  {
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NetworkDesign",
      required: true,
    },
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
    },
    configType: {
      type: String,
    },
    configuration: {
      type: String,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    downloadUrl: {
      type: String,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model(
  "GeneratedConfigTemplate",
  generatedConfigSchema
);
