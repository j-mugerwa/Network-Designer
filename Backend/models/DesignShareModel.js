const mongoose = require("mongoose");
const AppError = require("../utils/appError");

const designShareSchema = new mongoose.Schema(
  {
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NetworkDesign",
      required: [true, "Design reference is required"],
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sharer reference is required"],
    },
    sharedWith: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Recipient is required"],
      refPath: "sharedWithModel",
    },
    sharedWithModel: {
      type: String,
      required: true,
      enum: ["User", "Team"],
    },
    permission: {
      type: String,
      enum: ["view", "comment", "edit"],
      default: "view",
      required: [true, "Permission level is required"],
    },
    expiresAt: Date,
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

// Indexes
designShareSchema.index({ designId: 1 });
designShareSchema.index({ sharedBy: 1 });
designShareSchema.index({ sharedWith: 1 });
designShareSchema.index({ isActive: 1 });

// Prevent duplicate shares
designShareSchema.index(
  { designId: 1, sharedWith: 1, sharedWithModel: 1 },
  { unique: true }
);

// Virtual populate
designShareSchema.virtual("design", {
  ref: "NetworkDesign",
  localField: "designId",
  foreignField: "_id",
  justOne: true,
});

module.exports = mongoose.model("DesignShare", designShareSchema);
