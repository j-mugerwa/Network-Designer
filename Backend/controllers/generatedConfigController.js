const asyncHandler = require("express-async-handler");
const GeneratedConfiguration = require("../models/GeneratedConfigModel");
const ConfigurationTemplate = require("../models/ConfigurationTemplateModel");
const AppError = require("../utils/appError");

const { generateConfigPDF } = require("../services/configDownloadService");
const fs = require("fs");
const path = require("path");

// @desc    Get all generated configurations
// @route   GET /api/configurations
// @access  Private
const getConfigurations = asyncHandler(async (req, res, next) => {
  const { designId, equipmentId, templateId, applied, configType } = req.query;

  const filter = { generatedBy: req.user.uid };
  if (designId) filter.designId = designId;
  if (equipmentId) filter.equipmentId = equipmentId;
  if (templateId) filter.templateId = templateId;
  if (applied) filter.isApplied = applied === "true";
  if (configType) filter.configType = configType;

  const configs = await GeneratedConfiguration.find(filter)
    .populate("template", "name version configType")
    .populate("design", "designName version")
    .populate("equipment", "name model vendor")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: configs.length,
    data: configs,
  });
});

// @desc    Get single generated configuration
// @route   GET /api/configurations/:id
// @access  Private
const getConfiguration = asyncHandler(async (req, res, next) => {
  const config = await GeneratedConfiguration.findById(req.params.id)
    .populate("template", "name version configType variables")
    .populate("design", "designName version")
    .populate("equipment", "name model vendor");

  if (!config) {
    return next(AppError.notFound("Configuration"));
  }

  // Verify ownership
  if (config.generatedBy.toString() !== req.user.uid) {
    return next(AppError.unauthorized());
  }

  res.status(200).json({
    status: "success",
    data: config,
  });
});

// @desc    Mark configuration as applied
// @route   PATCH /api/configurations/:id/apply
// @access  Private
const applyConfiguration = asyncHandler(async (req, res, next) => {
  const config = await GeneratedConfiguration.findOneAndUpdate(
    {
      _id: req.params.id,
      generatedBy: req.user.uid,
    },
    {
      isApplied: true,
      appliedAt: new Date(),
      notes: req.body.notes,
    },
    { new: true }
  );

  if (!config) {
    return next(AppError.notFound("Configuration"));
  }

  // Here you would typically:
  // 1. Push the configuration to the device
  // 2. Update device status in your system
  // 3. Log the deployment

  res.status(200).json({
    status: "success",
    data: config,
    message: "Configuration marked as applied",
  });
});

// @desc    Download configuration file
// @route   GET /api/configurations/:id/download
// @access  Private
const downloadConfiguration = asyncHandler(async (req, res, next) => {
  const config = await GeneratedConfiguration.findById(req.params.id)
    .populate("template", "name version")
    .populate("design", "designName")
    .populate("equipment", "vendor model")
    .populate("generatedBy", "name email");

  if (!config) {
    return next(AppError.notFound("Configuration"));
  }

  // Verify ownership
  if (config.generatedBy._id.toString() !== req.user.uid) {
    return next(AppError.unauthorized());
  }

  // Generate PDF
  const { filePath, fileName } = await generateConfigPDF(config);

  // Set response headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  // Clean up after streaming
  fileStream.on("end", () => {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });
  });
});
// @desc    Regenerate configuration
// @route   POST /api/configurations/:id/regenerate
// @access  Private
const regenerateConfiguration = asyncHandler(async (req, res, next) => {
  const config = await GeneratedConfiguration.findById(req.params.id).populate(
    "template"
  );

  if (!config) {
    return next(AppError.notFound("Configuration"));
  }

  // Verify ownership
  if (config.generatedBy.toString() !== req.user.uid) {
    return next(AppError.unauthorized());
  }

  // Regenerate with current variable values or new ones if provided
  const variableValues = req.body.variableValues || config.variableValues;

  let newConfig = config.template.template;
  config.template.variables.forEach((variable) => {
    const value =
      variableValues.find((v) => v.name === variable.name)?.value ||
      variable.defaultValue ||
      "";
    newConfig = newConfig.replace(
      new RegExp(`\\{\\{${variable.name}\\}\\}`, "g"),
      value
    );
  });

  // Create new configuration record
  const regeneratedConfig = await GeneratedConfiguration.create({
    templateId: config.templateId,
    designId: config.designId,
    equipmentId: config.equipmentId,
    configType: config.configType,
    configuration: newConfig,
    variableValues,
    generatedBy: req.user.uid,
    parentConfig: config._id,
  });

  res.status(201).json({
    status: "success",
    data: regeneratedConfig,
    message: "Configuration regenerated successfully",
  });
});

// @desc    Delete generated configuration
// @route   DELETE /api/configurations/:id
// @access  Private
const deleteConfiguration = asyncHandler(async (req, res, next) => {
  const config = await GeneratedConfiguration.findOneAndDelete({
    _id: req.params.id,
    generatedBy: req.user.uid,
    isApplied: false, // Prevent deletion of applied configs
  });

  if (!config) {
    return next(
      new AppError(
        "Configuration not found, already applied, or access denied",
        404
      )
    );
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

module.exports = {
  getConfigurations,
  getConfiguration,
  applyConfiguration,
  downloadConfiguration,
  regenerateConfiguration,
  deleteConfiguration,
};
