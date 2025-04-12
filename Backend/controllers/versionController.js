const asyncHandler = require("express-async-handler");
const NetworkDesign = require("../models/NetworkDesignModel");
const DesignVersion = require("../models/DesignVersionModel");
const AppError = require("../utils/appError");
const { diff } = require("deep-diff");

// @desc    Create a new version
// @route   POST /api/designs/:designId/versions
// @access  Private
const createVersion = asyncHandler(async (req, res, next) => {
  const { designId } = req.params;
  const { changes, notes, versionBump = "patch", tags } = req.body;

  // Verify design exists and belongs to user
  const design = await NetworkDesign.findOne({
    _id: designId,
    userId: req.user.uid,
  });

  if (!design) {
    return next(AppError.notFound("Design"));
  }

  // Get next version number
  const version = await DesignVersion.getNextVersion(designId, versionBump);

  // Create new version
  const newVersion = await DesignVersion.create({
    designId,
    version,
    snapshot: design.toObject(),
    createdBy: req.user.uid,
    changes,
    notes,
    tags,
    parentVersion: req.body.parentVersion || undefined,
  });

  res.status(201).json({
    status: "success",
    data: newVersion,
  });
});

// @desc    Get all versions for a design
// @route   GET /api/designs/:designId/versions
// @access  Private
const getVersions = asyncHandler(async (req, res, next) => {
  const { designId } = req.params;
  const { publishedOnly, sort = "-createdAt", limit = 10 } = req.query;

  const filter = { designId };
  if (publishedOnly === "true") filter.isPublished = true;

  const versions = await DesignVersion.find(filter)
    .sort(sort)
    .limit(Number(limit))
    .populate("createdBy", "name email");

  res.status(200).json({
    status: "success",
    results: versions.length,
    data: versions,
  });
});

// @desc    Get specific version
// @route   GET /api/versions/:id
// @access  Private
const getVersion = asyncHandler(async (req, res, next) => {
  const version = await DesignVersion.findById(req.params.id)
    .populate("createdBy", "name email")
    .populate("parentVersion", "version");

  if (!version) {
    return next(AppError.notFound("Version"));
  }

  res.status(200).json({
    status: "success",
    data: version,
  });
});

// @desc    Compare two versions
// @route   GET /api/versions/compare
// @access  Private
const compareVersions = asyncHandler(async (req, res, next) => {
  const { version1, version2, designId } = req.query;

  if (!version1 || !version2 || !designId) {
    return next(
      new AppError(
        "Please provide version1, version2 and designId parameters",
        400
      )
    );
  }

  const versions = await DesignVersion.find({
    designId,
    $or: [
      { _id: version1 },
      { _id: version2 },
      { version: version1 },
      { version: version2 },
    ],
  });

  if (versions.length !== 2) {
    return next(new AppError("One or both versions not found", 404));
  }

  const differences = diff(versions[0].snapshot, versions[1].snapshot) || [];
  const changes = differences.map((d) => ({
    path: d.path.join("."),
    operation: d.kind,
    oldValue: d.lhs,
    newValue: d.rhs,
  }));

  res.status(200).json({
    status: "success",
    data: {
      version1: versions[0].version,
      version2: versions[1].version,
      changes,
      summary: {
        totalChanges: changes.length,
        added: changes.filter((c) => c.operation === "N").length,
        removed: changes.filter((c) => c.operation === "D").length,
        modified: changes.filter((c) => c.operation === "E").length,
      },
    },
  });
});

// @desc    Publish a version
// @route   PATCH /api/versions/:id/publish
// @access  Private
const publishVersion = asyncHandler(async (req, res, next) => {
  const version = await DesignVersion.findByIdAndUpdate(
    req.params.id,
    { isPublished: true, publishedAt: new Date() },
    { new: true }
  );

  if (!version) {
    return next(AppError.notFound("Version"));
  }

  res.status(200).json({
    status: "success",
    data: version,
  });
});

// @desc    Restore a version
// @route   POST /api/versions/:id/restore
// @access  Private
const restoreVersion = asyncHandler(async (req, res, next) => {
  const version = await DesignVersion.findById(req.params.id);

  if (!version) {
    return next(AppError.notFound("Version"));
  }

  // Verify design exists and belongs to user
  const design = await NetworkDesign.findOneAndUpdate(
    { _id: version.designId, userId: req.user.uid },
    version.snapshot,
    { new: true }
  );

  if (!design) {
    return next(AppError.notFound("Design"));
  }

  res.status(200).json({
    status: "success",
    data: design,
    message: `Design restored to version ${version.version}`,
  });
});

module.exports = {
  createVersion,
  getVersions,
  getVersion,
  compareVersions,
  publishVersion,
  restoreVersion,
};
