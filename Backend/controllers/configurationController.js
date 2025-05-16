const asyncHandler = require("express-async-handler");
const ConfigurationTemplate = require("../models/ConfigurationTemplateModel");
const GeneratedConfiguration = require("../models/GeneratedConfigModel");
const AppError = require("../utils/appError");
const { validateTemplateVariables } = require("../utils/configTemplateUtils");

// @desc    Create a new configuration template
// @route   POST /api/config-templates
// @access  Private (Admin/Editor)
const createTemplate = asyncHandler(async (req, res, next) => {
  const { template, variables, ...otherFields } = req.body;

  // Validate template variables
  if (!validateTemplateVariables(template, variables)) {
    return next(new AppError("Template contains undefined variables", 400));
  }

  const configTemplate = await ConfigurationTemplate.create({
    ...otherFields,
    template,
    variables,
    createdBy: req.user.uid,
  });

  res.status(201).json({
    status: "success",
    data: configTemplate,
  });
});

// @desc    Get all configuration templates
// @route   GET /api/config-templates
// @access  Private
const getTemplates = asyncHandler(async (req, res, next) => {
  const { equipmentType, configType, vendor, active } = req.query;

  const filter = {};
  if (equipmentType) filter.equipmentType = equipmentType;
  if (configType) filter.configType = configType;
  if (vendor) filter.vendor = vendor;
  if (active) filter.isActive = active === "true";

  const templates = await ConfigurationTemplate.find(filter)
    .populate("equipmentType", "name category")
    .sort({ vendor: 1, model: 1 });

  res.status(200).json({
    status: "success",
    results: templates.length,
    data: templates,
  });
});

// @desc    Get single template
// @route   GET /api/config-templates/:id
// @access  Private
const getTemplate = asyncHandler(async (req, res, next) => {
  const template = await ConfigurationTemplate.findById(req.params.id).populate(
    "equipmentType",
    "name category"
  );

  if (!template) {
    return next(AppError.notFound("Configuration template not found"));
  }

  res.status(200).json({
    status: "success",
    data: template,
  });
});

// @desc    Update template
// @route   PUT /api/config-templates/:id
// @access  Private (Admin/Editor)
const updateTemplate = asyncHandler(async (req, res, next) => {
  const { template, variables, ...otherFields } = req.body;

  if (
    template &&
    variables &&
    !validateTemplateVariables(template, variables)
  ) {
    return next(new AppError("Template contains undefined variables", 400));
  }

  const updatedTemplate = await ConfigurationTemplate.findByIdAndUpdate(
    req.params.id,
    { ...otherFields, template, variables },
    { new: true, runValidators: true }
  );

  if (!updatedTemplate) {
    return next(AppError.notFound("Configuration template"));
  }

  res.status(200).json({
    status: "success",
    data: updatedTemplate,
  });
});

// @desc    Generate device configuration
// @route   POST /api/config-templates/generate
// @access  Private
const generateDeviceConfig = asyncHandler(async (req, res, next) => {
  const { templateId, designId, equipmentId, variableValues } = req.body;

  // Get template and validate
  const template = await ConfigurationTemplate.findOne({
    _id: templateId,
    isActive: true,
  });

  if (!template) {
    return next(AppError.notFound("Active configuration template not found"));
  }

  // Validate all required variables are provided
  const missingVars = template.variables
    .filter((v) => v.required && !variableValues[v.name])
    .map((v) => v.name);

  if (missingVars.length > 0) {
    return next(
      new AppError(
        `Missing required configuration variables: ${missingVars.join(", ")}`,
        400
      )
    );
  }

  // Generate configuration
  let config = template.template;
  template.variables.forEach((variable) => {
    const value = variableValues[variable.name] || variable.defaultValue || "";
    config = config.replace(
      new RegExp(`\\{\\{${variable.name}\\}\\}`, "g"),
      value
    );
  });

  // Save generated configuration
  const generatedConfig = await GeneratedConfiguration.create({
    templateId,
    designId,
    equipmentId,
    configuration: config,
    generatedBy: req.user.uid,
    variableValues,
  });

  res.status(201).json({
    status: "success",
    data: {
      configuration: config,
      metadata: generatedConfig,
    },
  });
});

// @desc    Get generated configurations
// @route   GET /api/config-templates/generated
// @access  Private
const getGeneratedConfigs = asyncHandler(async (req, res, next) => {
  const { designId, equipmentId } = req.query;

  const filter = { generatedBy: req.user.uid };
  if (designId) filter.designId = designId;
  if (equipmentId) filter.equipmentId = equipmentId;

  const configs = await GeneratedConfiguration.find(filter)
    .populate("templateId", "name configType version")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: configs.length,
    data: configs,
  });
});

module.exports = {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  generateDeviceConfig,
  getGeneratedConfigs,
};
