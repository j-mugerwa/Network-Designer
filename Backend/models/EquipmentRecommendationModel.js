const mongoose = require("mongoose");

const equipmentRecommendationSchema = new mongoose.Schema(
  {
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NetworkDesign",
      required: true,
    },
    recommendations: [
      {
        category: String,
        recommendedEquipment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Equipment",
        },
        quantity: Number,
        placement: String,
        justification: String,
      },
    ],
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "EquipmentRecommendation",
  equipmentRecommendationSchema
);
