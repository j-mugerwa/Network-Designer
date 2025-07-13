const asyncHandler = require("express-async-handler");
const ConfigurationTemplate = require("../models/ConfigurationTemplateModel");
const Equipment = require("../models/EquipmentModel");
const AppError = require("../utils/appError");
const {
  uploadToCloudinary,
  uploadConfigToCloudinary,
  deleteFromCloudinary,
  shouldUseCloudinary,
} = require("../utils/cloudinaryUtils");
const { fileSizeFormatter } = require("../utils/fileUpload");

// @desc    Create a new configuration template
// @route   POST /api/config-templates
// @access  Private (Admin/Editor)
const createTemplate = asyncHandler(async (req, res, next) => {
  const { configSourceType, variables, ...otherFields } = req.body;

  // Handle file upload if present
  let configFile = null;
  if (req.file && configSourceType === "file") {
    try {
      const uploadResult = await uploadConfigToCloudinary(req.file.path, {
        folder: `config-templates/${req.user._id}`,
      });

      configFile = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        originalName: req.file.originalname,
        size: uploadResult.bytes,
        mimeType: req.file.mimetype,
        uploadedBy: req.user._id,
      };
    } catch (error) {
      return next(new AppError(`File upload failed: ${error.message}`, 500));
    }
  }

  // For template-based configs, validate variables
  if (configSourceType === "template") {
    if (!variables || variables.length === 0) {
      return next(
        new AppError("Template-based configurations require variables", 400)
      );
    }
  }

  const configTemplate = await ConfigurationTemplate.create({
    ...otherFields,
    configSourceType: configSourceType || "template",
    variables,
    configFile,
    createdBy: req.user._id,
    lastUpdatedBy: req.user._id,
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
  const { equipmentCategory, configType, vendor, active, sourceType } =
    req.query;

  const filter = {};
  if (equipmentCategory) filter.equipmentCategory = equipmentCategory;
  if (configType) filter.configType = configType;
  if (vendor) filter.vendor = vendor;
  if (active) filter.isActive = active === "true";
  if (sourceType) filter.configSourceType = sourceType;

  const templates = await ConfigurationTemplate.find(filter)
    .sort({ vendor: 1, model: 1 })
    .populate("createdBy", "name email")
    .populate("deployments.device", "manufacturer model");

  res.status(200).json({
    status: "success",
    results: templates.length,
    data: templates,
  });
});

// For specific User templates
const getUserTemplates = asyncHandler(async (req, res) => {
  try {
    const templates = await ConfigurationTemplate.find({
      $or: [
        { createdBy: req.user._id }, // Use the authenticated user's ID
        { isSystemTemplate: true },
      ],
    })
      .populate("createdBy", "name email")
      .populate("lastUpdatedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: templates.length,
      data: templates,
    });
  } catch (error) {
    console.error("Error in getUserTemplates:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch user templates",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// For system-wide access (admin only)
const getAllTemplatesAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new AppError("Only admins can access all templates", 403));
  }

  const templates = await ConfigurationTemplate.find()
    .populate("createdBy", "name email")
    .populate("lastUpdatedBy", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: templates.length,
    data: templates,
  });
});

// @desc    Get single template with deployments
// @route   GET /api/config-templates/:id
// @access  Private
const getTemplate = asyncHandler(async (req, res, next) => {
  const template = await ConfigurationTemplate.findById(req.params.id)
    .populate("createdBy", "name email")
    .populate("lastUpdatedBy", "name email")
    .populate({
      path: "deployments.device",
      select: "manufacturer model specs.managementIp",
    })
    .populate("deployments.deployedBy", "name email");

  if (!template) {
    return next(new AppError("Configuration template not found", 404));
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
  const { template, variables, configSourceType, ...otherFields } = req.body;

  const existingTemplate = await ConfigurationTemplate.findById(req.params.id);
  if (!existingTemplate) {
    return next(new AppError("Configuration template not found", 404));
  }

  // Handle file upload if updating to file-based config
  let configFile = existingTemplate.configFile;
  if (req.file && configSourceType === "file") {
    try {
      // Delete old file from Cloudinary if it exists
      if (configFile?.publicId) {
        await deleteFromCloudinary(configFile.publicId, "raw");
      }

      const uploadResult = await uploadConfigToCloudinary(req.file.path, {
        folder: `config-templates/${req.user._id}`,
      });

      configFile = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        originalName: req.file.originalname,
        size: uploadResult.bytes,
        mimeType: req.file.mimetype,
        uploadedBy: req.user._id,
      };
    } catch (error) {
      return next(new AppError(`File upload failed: ${error.message}`, 500));
    }
  }

  // Validate template variables if template is being updated
  if (template && variables && configSourceType === "template") {
    const validationErrors = existingTemplate.validateVariables(variables);
    if (validationErrors) {
      return next(new AppError(validationErrors.join(", "), 400));
    }
  }

  const updatedTemplate = await ConfigurationTemplate.findByIdAndUpdate(
    req.params.id,
    {
      ...otherFields,
      template,
      variables,
      configSourceType,
      configFile,
      lastUpdatedBy: req.user._id,
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: "success",
    data: updatedTemplate,
  });
});

// @desc    Deploy configuration to device
// @route   POST /api/config-templates/:id/deploy
// @access  Private
const deployConfiguration = asyncHandler(async (req, res, next) => {
  const { deviceId, variables, notes } = req.body;

  // Get template and device
  const template = await ConfigurationTemplate.findById(req.params.id);
  const device = await Equipment.findById(deviceId);

  if (!template) {
    return next(new AppError("Configuration template not found", 404));
  }
  if (!device) {
    return next(new AppError("Device not found", 404));
  }

  // Check compatibility
  if (!template.isCompatibleWithDevice(device)) {
    return next(
      new AppError("Configuration is not compatible with this device", 400)
    );
  }

  // Handle file upload if this is a new file-based deployment
  let fileDeployment = null;
  if (req.file && template.configSourceType === "file") {
    try {
      const uploadResult = await uploadConfigToCloudinary(req.file.path, {
        folder: `device-configs/${deviceId}`,
      });

      fileDeployment = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        originalName: req.file.originalname,
        size: fileSizeFormatter(uploadResult.bytes),
      };
    } catch (error) {
      return next(
        new AppError(`Configuration file upload failed: ${error.message}`, 500)
      );
    }
  }

  // Validate variables if template-based
  let renderedConfig = null;
  if (template.configSourceType === "template") {
    const validationErrors = template.validateVariables(variables || {});
    if (validationErrors) {
      return next(new AppError(validationErrors.join(", "), 400));
    }
    renderedConfig = template.renderTemplate(variables);
  }

  // Add deployment record
  const deployment = {
    device: deviceId,
    deployedBy: req.user._id,
    variables,
    renderedConfig,
    fileDeployment,
    notes,
  };

  template.deployments.push(deployment);
  await template.save();

  // Update device's configurations
  await Equipment.findByIdAndUpdate(deviceId, {
    $push: {
      configurations: {
        configTemplate: template._id,
        appliedAt: new Date(),
        appliedBy: req.user._id,
        status: "pending",
      },
    },
  });

  res.status(200).json({
    status: "success",
    data: {
      message: "Configuration deployed successfully",
      deployment,
    },
  });
});

// @desc    Get deployment history for a device
// @route   GET /api/devices/:deviceId/config-deployments
// @access  Private
const getDeviceDeploymentHistory = asyncHandler(async (req, res, next) => {
  const deployments = await ConfigurationTemplate.find({
    "deployments.device": req.params.deviceId,
  })
    .select("name version configType configSourceType deployments")
    .populate("deployments.deployedBy", "name email");

  if (!deployments) {
    return next(new AppError("No deployments found for this device", 404));
  }

  // Flatten deployments array
  const history = deployments.flatMap((template) =>
    template.deployments
      .filter((d) => d.device.toString() === req.params.deviceId)
      .map((d) => ({
        templateId: template._id,
        templateName: template.name,
        templateVersion: template.version,
        configType: template.configType,
        configSourceType: template.configSourceType,
        ...d.toObject(),
      }))
  );

  // Sort by deployment date
  history.sort((a, b) => b.deployedAt - a.deployedAt);

  res.status(200).json({
    status: "success",
    results: history.length,
    data: history,
  });
});

// @desc    Delete configuration template
// @route   DELETE /api/config-templates/:id
// @access  Private (Admin/Editor)
const deleteTemplate = asyncHandler(async (req, res, next) => {
  const template = await ConfigurationTemplate.findById(req.params.id);

  if (!template) {
    return next(new AppError("Configuration template not found", 404));
  }

  // Check if template has active deployments
  const hasActiveDeployments = template.deployments.some(
    (d) => d.status === "active"
  );

  if (hasActiveDeployments) {
    return next(
      new AppError(
        "Cannot delete template with active deployments. Rollback deployments first.",
        400
      )
    );
  }

  // Delete associated file from Cloudinary if exists
  if (template.configFile?.publicId) {
    try {
      await deleteFromCloudinary(template.configFile.publicId, "raw");
    } catch (error) {
      console.error("Failed to delete file from Cloudinary:", error);
      // Continue with deletion even if file deletion fails
    }
  }

  await ConfigurationTemplate.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// @desc    Download configuration file
// @route   GET /api/config-templates/:id/file
// @access  Private
const downloadConfigFile = asyncHandler(async (req, res, next) => {
  const template = await ConfigurationTemplate.findById(req.params.id);

  if (!template) {
    return next(new AppError("Configuration template not found", 404));
  }

  if (template.configSourceType !== "file" || !template.configFile?.url) {
    return next(
      new AppError("This template does not have a configuration file", 400)
    );
  }

  // Redirect to Cloudinary URL if using Cloudinary
  if (shouldUseCloudinary()) {
    return res.redirect(template.configFile.url);
  }

  // Fallback to local file download
  if (!template.configFile.path || !fs.existsSync(template.configFile.path)) {
    return next(new AppError("Configuration file not found", 404));
  }

  res.download(template.configFile.path, template.configFile.originalName);
});

// @desc    Get compatible templates for a device
// @route   GET /api/devices/:deviceId/compatible-templates
// @access  Private
const getCompatibleTemplates = asyncHandler(async (req, res, next) => {
  const device = await Equipment.findById(req.params.deviceId);
  if (!device) {
    return next(new AppError("Device not found", 404));
  }

  const templates = await ConfigurationTemplate.findCompatibleTemplates(device);

  res.status(200).json({
    status: "success",
    results: templates.length,
    data: templates,
  });
});

// @desc    Update deployment status
// @route   PATCH /api/config-templates/:templateId/deployments/:deploymentId
// @access  Private (Admin/Editor)
const updateDeploymentStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!["pending", "active", "failed", "rolled-back"].includes(status)) {
    return next(new AppError("Invalid deployment status", 400));
  }

  const template = await ConfigurationTemplate.findById(req.params.templateId);
  if (!template) {
    return next(new AppError("Configuration template not found", 404));
  }

  const deployment = template.deployments.id(req.params.deploymentId);
  if (!deployment) {
    return next(new AppError("Deployment record not found", 404));
  }

  deployment.status = status;
  deployment.notes = req.body.notes || deployment.notes;

  await template.save();

  // Update device's configuration status if needed
  if (status === "active" || status === "rolled-back") {
    await Equipment.updateOne(
      {
        _id: deployment.device,
        "configurations.configTemplate": template._id,
      },
      {
        $set: {
          "configurations.$.status": status,
          "configurations.$.isCurrent": status === "active",
          "networkConfig.status":
            status === "active" ? "configured" : "unconfigured",
        },
      }
    );

    // Clean up old active configurations if this is now active
    if (status === "active") {
      await Equipment.updateMany(
        {
          _id: deployment.device,
          "configurations.configTemplate": { $ne: template._id },
          "configurations.isCurrent": true,
        },
        {
          $set: {
            "configurations.$[].isCurrent": false,
          },
        }
      );
    }
  }

  res.status(200).json({
    status: "success",
    data: deployment,
  });
});

module.exports = {
  createTemplate,
  getTemplates,
  getTemplate,
  getUserTemplates,
  getAllTemplatesAdmin,
  updateTemplate,
  deployConfiguration,
  deleteTemplate,
  getDeviceDeploymentHistory,
  downloadConfigFile,
  getCompatibleTemplates,
  updateDeploymentStatus,
};
