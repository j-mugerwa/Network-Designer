const mongoose = require("mongoose");

const designShareSchema = new mongoose.Schema(
  {
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NetworkDesign",
      required: true,
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sharedWith: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    },
    permission: {
      type: String,
      enum: ["view", "comment", "edit"],
      default: "view",
    },
    sharedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("DesignShare", designShareSchema);
