const mongoose = require("mongoose");
const AppError = require("../utils/appError");

const teamMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User reference is required"],
  },
  role: {
    type: String,
    enum: ["owner", "admin", "member"],
    default: "member",
    required: [true, "Role is required"],
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      maxlength: [50, "Team name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
    },
    members: [teamMemberSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    avatar: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
teamSchema.index({ name: 1 });
teamSchema.index({ createdBy: 1 });
teamSchema.index({ isActive: 1 });

// Ensure each user is only added once to a team
teamSchema.index({ "members.userId": 1 }, { unique: true });

// Virtual populate
teamSchema.virtual("owner", {
  ref: "User",
  localField: "createdBy",
  foreignField: "_id",
  justOne: true,
});

// Pre-save hook to ensure creator is a member
teamSchema.pre("save", function (next) {
  const creatorIsMember = this.members.some(
    (m) => m.userId.toString() === this.createdBy.toString()
  );

  if (!creatorIsMember) {
    this.members.push({
      userId: this.createdBy,
      role: "owner",
    });
  }
  next();
});

module.exports = mongoose.model("Team", teamSchema);
