const mongoose = require("mongoose");

const equipmentRecommendationSchema = new mongoose.Schema(
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
    recommendations: [
      {
        category: {
          type: String,
          required: true,
          enum: ["switch", "router", "firewall", "ap", "server"],
        },
        recommendedEquipment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Equipment",
          required: false,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        placement: {
          type: String,
          required: true,
        },
        justification: {
          type: String,
          required: true,
        },
        alternatives: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Equipment",
          },
        ],
        isSystemRecommended: {
          type: Boolean,
          default: true,
        },
      },
    ],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    version: {
      type: String,
      default: "1.0",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
equipmentRecommendationSchema.index({ designId: 1 });
equipmentRecommendationSchema.index({ userId: 1 });
equipmentRecommendationSchema.index({ generatedAt: -1 });
equipmentRecommendationSchema.index({ "recommendations.category": 1 });

// Virtual for getting the design name
equipmentRecommendationSchema.virtual("design", {
  ref: "NetworkDesign",
  localField: "designId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for getting the user details
equipmentRecommendationSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

module.exports = mongoose.model(
  "EquipmentRecommendation",
  equipmentRecommendationSchema
);
