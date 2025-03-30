const mongoose = require("mongoose");
const configTemplateSchema = new mongoose.Schema(
  {
    equipmentType: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment" },
    vendor: String,
    configType: {
      type: String,
      enum: ["basic", "vlan", "routing", "security"],
    },
    template: String, // The actual configuration template with variables
    variables: [
      {
        name: String,
        description: String,
        defaultValue: String,
      },
    ],
  },
  { timestamps: true }
);
module.exports = mongoose.model("ConfigTemplate", configTemplateSchema);
