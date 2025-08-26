const asyncHandler = require("express-async-handler");
const DesignOptimization = require("../models/DesignOptimizationModel");
const NetworkDesign = require("../models/NetworkDesignModel");
const { generateProfessionalPDF } = require("../services/pdfGenerator");
const AppError = require("../utils/appError");

// Helper function to generate optimization report
const generateOptimizationReport = async (optimization, design) => {
  const reportContent = {
    title: `Optimization Report - ${design.designName}`,
    optimizationType: optimization.optimizationType,
    createdAt: optimization.createdAt,
    metrics: optimization.metrics,
    recommendations: optimization.recommendations,
    designDetails: {
      name: design.designName,
      version: design.version,
      description: design.description,
    },
  };

  try {
    const pdfUrl = await generateProfessionalPDF(reportContent);
    return pdfUrl;
  } catch (error) {
    console.error("Report generation failed:", error);
    return null;
  }
};

// @desc    Create a new optimization
// @route   POST /api/optimizations
// @access  Private

const createOptimization = asyncHandler(async (req, res, next) => {
  const { designId, optimizationType, parameters } = req.body;
  const userId = req.user.uid;

  // Verify design exists and belongs to user
  const design = await NetworkDesign.findOne({
    _id: designId,
    userId,
  });

  if (!design) {
    return next(AppError.notFound("Design"));
  }

  // Create optimization record
  const optimization = new DesignOptimization({
    designId,
    optimizationType: optimizationType || "default",
    parameters,
    status: "queued",
    createdBy: userId,
  });

  await optimization.save();

  // In real implementation, you would queue the optimization job here
  // For demo purposes, we'll simulate completion after 2 seconds
  setTimeout(async () => {
    try {
      // Simulate optimization results
      optimization.metrics = {
        costReduction: Math.random() * 30 + 5, // 5-35%
        performanceImprovement: Math.random() * 40 + 10, // 10-50%
        reliabilityGain: Math.random() * 20 + 5, // 5-25%
      };

      optimization.recommendations = [
        "Upgrade router firmware to latest version",
        "Implement QoS policies for critical traffic",
        "Consider redundant links for core switches",
      ];

      optimization.status = "completed";

      // Generate and attach report
      optimization.reportUrl = await generateOptimizationReport(
        optimization,
        design
      );

      await optimization.save();
    } catch (error) {
      console.error("Optimization job failed:", error);
    }
  }, 2000);

  res.status(201).json({
    status: "success",
    data: {
      optimization,
      message: "Optimization job queued successfully",
    },
  });
});

// @desc    Get all optimizations for user
// @route   GET /api/optimizations
// @access  Private
const getUserOptimizations = asyncHandler(async (req, res, next) => {
  const userId = req.user.uid;

  const optimizations = await DesignOptimization.find({
    createdBy: userId,
    archived: { $ne: true },
  })
    .populate("designId", "designName version")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: optimizations.length,
    data: optimizations,
  });
});

// @desc    Get single optimization
// @route   GET /api/optimizations/:id
// @access  Private
const getOptimization = asyncHandler(async (req, res, next) => {
  const optimization = await DesignOptimization.findOne({
    _id: req.params.id,
    createdBy: req.user.uid,
  }).populate("designId", "designName version");

  if (!optimization) {
    return next(new AppError("Optimization not found or access denied", 404));
  }

  res.status(200).json({
    status: "success",
    data: optimization,
  });
});

// @desc    Update optimization
// @route   PUT /api/optimizations/:id
// @access  Private
const updateOptimization = asyncHandler(async (req, res, next) => {
  const { parameters, notes } = req.body;

  const optimization = await DesignOptimization.findOneAndUpdate(
    {
      _id: req.params.id,
      createdBy: req.user.uid,
      status: { $nin: ["running", "completed"] },
    },
    {
      parameters,
      notes,
      updatedAt: Date.now(),
    },
    { new: true, runValidators: true }
  );

  if (!optimization) {
    return next(
      new AppError(
        "Optimization not found, already completed, or access denied",
        404
      )
    );
  }

  res.status(200).json({
    status: "success",
    data: optimization,
  });
});

// @desc    Get optimization results
// @route   GET /api/optimizations/:id/results
// @access  Private

const getOptimizationResults = asyncHandler(async (req, res, next) => {
  const optimization = await DesignOptimization.findOne({
    _id: req.params.id,
    createdBy: req.user.uid,
  }).populate("designId", "designName version");

  if (!optimization) {
    return next(AppError.notFound("Optimization"));
  }

  if (optimization.status !== "completed") {
    return next(new AppError("Optimization results not ready yet", 400));
  }

  // Generate fresh report if not exists or expired
  if (!optimization.reportUrl || req.query.regenerate === "true") {
    optimization.reportUrl = await generateOptimizationReport(
      optimization,
      optimization.designId
    );
    await optimization.save();
  }

  res.status(200).json({
    status: "success",
    data: {
      metrics: optimization.metrics,
      recommendations: optimization.recommendations,
      reportUrl: optimization.reportUrl,
      design: optimization.designId,
    },
  });
});

// @desc    Archive optimization
// @route   PUT /api/optimizations/:id/archive
// @access  Private
const archiveOptimization = asyncHandler(async (req, res, next) => {
  const optimization = await DesignOptimization.findOneAndUpdate(
    {
      _id: req.params.id,
      createdBy: req.user.uid,
    },
    { archived: true },
    { new: true }
  );

  if (!optimization) {
    return next(new AppError("Optimization not found or access denied", 404));
  }

  res.status(200).json({
    status: "success",
    data: null,
    message: "Optimization archived successfully",
  });
});

// @desc    Clone optimization
// @route   POST /api/optimizations/:id/clone
// @access  Private
const cloneOptimization = asyncHandler(async (req, res, next) => {
  const original = await DesignOptimization.findOne({
    _id: req.params.id,
    createdBy: req.user.uid,
  });

  if (!original) {
    return next(new AppError("Optimization not found or access denied", 404));
  }

  const clone = new DesignOptimization({
    designId: original.designId,
    optimizationType: original.optimizationType,
    parameters: original.parameters,
    status: "queued",
    createdBy: req.user.uid,
    isClone: true,
    originalOptimizationId: original._id,
  });

  await clone.save();

  res.status(201).json({
    status: "success",
    data: clone,
    message: "Optimization cloned successfully",
  });
});

module.exports = {
  createOptimization,
  getUserOptimizations,
  getOptimization,
  updateOptimization,
  getOptimizationResults,
  archiveOptimization,
  cloneOptimization,
};
