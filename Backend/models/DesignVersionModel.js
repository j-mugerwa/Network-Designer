const mongoose = require("mongoose");
const AppError = require("../utils/appError");

const changeSchema = new mongoose.Schema(
  {
    path: {
      type: String,
      required: [true, "Change path is required"],
    },
    operation: {
      type: String,
      enum: ["add", "remove", "modify"],
      required: [true, "Change operation is required"],
    },
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    impact: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    description: String,
  },
  { _id: false }
);

const designVersionSchema = new mongoose.Schema(
  {
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NetworkDesign",
      required: [true, "Design reference is required"],
      index: true,
    },
    version: {
      type: String,
      required: [true, "Version is required"],
      match: [/^\d+\.\d+\.\d+$/, "Version must be in semantic version format"],
    },
    semanticVersion: {
      major: { type: Number, required: true },
      minor: { type: Number, required: true },
      patch: { type: Number, required: true },
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Version snapshot is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
    },
    changes: {
      type: [changeSchema],
      validate: {
        validator: function (v) {
          // Require at least one change for non-initial versions
          return this.version === "1.0.0" || v.length > 0;
        },
        message: "Version must include changes unless it's the initial version",
      },
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    parentVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DesignVersion",
    },
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
designVersionSchema.index({ designId: 1, version: 1 }, { unique: true });
designVersionSchema.index({
  "semanticVersion.major": 1,
  "semanticVersion.minor": 1,
  "semanticVersion.patch": 1,
});
designVersionSchema.index({ isPublished: 1 });
designVersionSchema.index({ tags: 1 });

// Pre-save hook to maintain semantic version numbers
designVersionSchema.pre("save", function (next) {
  if (!this.version) {
    const [major, minor, patch] = this.version.split(".").map(Number);
    this.semanticVersion = { major, minor, patch };
  }
  next();
});

// Static method to get next version number
designVersionSchema.statics.getNextVersion = async function (
  designId,
  versionBump = "patch"
) {
  const lastVersion = await this.findOne({ designId }).sort({
    "semanticVersion.major": -1,
    "semanticVersion.minor": -1,
    "semanticVersion.patch": -1,
  });

  if (!lastVersion) return "1.0.0";

  let { major, minor, patch } = lastVersion.semanticVersion;

  switch (versionBump) {
    case "major":
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case "minor":
      minor += 1;
      patch = 0;
      break;
    case "patch":
      patch += 1;
      break;
  }

  return `${major}.${minor}.${patch}`;
};

module.exports = mongoose.model("DesignVersion", designVersionSchema);
