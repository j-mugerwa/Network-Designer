const mongoose = require("mongoose");
const AppError = require("../utils/appError");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: [
        "design_shared", // When a design is shared with a user
        "team_design_shared", // When a design is shared with a team
        "comment_added", // When someone comments on your design
        "comment_reply", // When someone replies to your comment
        "comment_tag", // When you're tagged in a comment
        "comment_like", // When someone likes your comment
        "team_invite", // When you're added to a team
        "team_mention", // When your team is mentioned
        "design_updated", // When a shared design is updated
        "access_level_changed", // When your access level changes
      ],
    },
    metadata: {
      designId: mongoose.Schema.Types.ObjectId,
      commentId: mongoose.Schema.Types.ObjectId,
      teamId: mongoose.Schema.Types.ObjectId,
      designName: String,
      permission: String,
      previousPermission: String,
      newPermission: String,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for optimized queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ team: 1, read: 1, createdAt: -1 });
notificationSchema.index({ sender: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual populate
notificationSchema.virtual("senderDetails", {
  ref: "User",
  localField: "sender",
  foreignField: "_id",
  justOne: true,
});

notificationSchema.virtual("recipientDetails", {
  ref: "User",
  localField: "recipient",
  foreignField: "_id",
  justOne: true,
});

notificationSchema.virtual("teamDetails", {
  ref: "Team",
  localField: "team",
  foreignField: "_id",
  justOne: true,
});

// Pre-save hook to clean metadata based on type
notificationSchema.pre("save", function (next) {
  // Clean up metadata based on notification type
  switch (this.type) {
    case "design_shared":
    case "team_design_shared":
      if (!this.metadata.designId || !this.metadata.designName) {
        return next(
          new AppError(
            "Design ID and name are required for share notifications",
            400
          )
        );
      }
      break;

    case "comment_added":
    case "comment_reply":
    case "comment_like":
      if (!this.metadata.designId || !this.metadata.commentId) {
        return next(
          new AppError(
            "Design ID and comment ID are required for comment notifications",
            400
          )
        );
      }
      break;

    case "team_invite":
      if (!this.metadata.teamId) {
        return next(
          new AppError("Team ID is required for team invite notifications", 400)
        );
      }
      break;

    case "access_level_changed":
      if (
        !this.metadata.designId ||
        !this.metadata.newPermission ||
        !this.metadata.previousPermission
      ) {
        return next(
          new AppError(
            "Design ID and permission levels are required for access change notifications",
            400
          )
        );
      }
      break;
  }
  next();
});

module.exports = mongoose.model("Notification", notificationSchema);
