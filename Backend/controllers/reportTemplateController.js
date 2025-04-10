const asyncHandler = require("express-async-handler");
const ReportTemplate = require("../models/ReportTemplateModel");
const NetworkReport = require("../models/ReportModel");

// @desc    Get all templates
// @route   GET /api/templates
// @access  Private
const getTemplates = asyncHandler(async (req, res) => {
  try {
    const { category, search, activeOnly } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };
    if (activeOnly !== "false") filter.isActive = true;

    const templates = await ReportTemplate.find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    res.json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch templates",
    });
  }
});

// @desc    Get template by ID
// @route   GET /api/templates/:id
// @access  Private
const getTemplate = asyncHandler(async (req, res) => {
  try {
    const template = await ReportTemplate.findById(req.params.id)
      .populate("usageCount")
      .lean()
      .exec();

    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found",
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch template",
    });
  }
});

// @desc    Create new template
// @route   POST /api/templates
// @access  Private (Admin)
const createTemplate = asyncHandler(async (req, res) => {
  try {
    const { name, description, category, sections } = req.body;

    // Validate required sections for certain categories
    if (
      category === "compliance" &&
      !sections.some((s) => s.key === "compliance_summary")
    ) {
      return res.status(400).json({
        success: false,
        error: "Compliance templates must include a compliance_summary section",
      });
    }

    const template = new ReportTemplate({
      name,
      description,
      category,
      sections: sections.map((section, index) => ({
        ...section,
        order: section.order || index,
      })),
      metadata: {
        author: req.user.name,
        company: req.user.company || "NetPlanner",
      },
    });

    await template.save();

    res.status(201).json({
      success: true,
      message: "Template created successfully",
      data: template,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Template with this name already exists",
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to create template",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @desc    Update template
// @route   PUT /api/templates/:id
// @access  Private (Admin)
const updateTemplate = asyncHandler(async (req, res) => {
  try {
    const { sections, ...updateData } = req.body;

    const template = await ReportTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found",
      });
    }

    // Prevent modification of system templates
    if (template.isSystemTemplate && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: "System templates can only be modified by admins",
      });
    }

    // Update sections if provided
    if (sections) {
      template.sections = sections.map((section, index) => ({
        ...section,
        order: section.order || index,
      }));
    }

    // Update other fields
    Object.keys(updateData).forEach((key) => {
      if (key !== "isSystemTemplate") {
        // Prevent changing system template flag
        template[key] = updateData[key];
      }
    });

    await template.save();

    res.json({
      success: true,
      message: "Template updated successfully",
      data: template,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Template with this name already exists",
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to update template",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @desc    Toggle template active status
// @route   PATCH /api/templates/:id/status
// @access  Private (Admin)
const toggleTemplateStatus = asyncHandler(async (req, res) => {
  try {
    const template = await ReportTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found",
      });
    }

    // Prevent deactivation of system templates
    if (template.isSystemTemplate && !template.isActive && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: "System templates can only be reactivated by admins",
      });
    }

    template.isActive = !template.isActive;
    await template.save();

    res.json({
      success: true,
      message: `Template ${template.isActive ? "activated" : "deactivated"}`,
      data: {
        isActive: template.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update template status",
    });
  }
});

// @desc    Delete template
// @route   DELETE /api/templates/:id
// @access  Private (Admin)
const deleteTemplate = asyncHandler(async (req, res) => {
  try {
    const template = await ReportTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found",
      });
    }

    // Prevent deletion of system templates or templates with existing reports
    const reportCount = await NetworkReport.countDocuments({
      templateId: template._id,
    });

    if (template.isSystemTemplate) {
      return res.status(403).json({
        success: false,
        error: "System templates cannot be deleted",
      });
    }

    if (reportCount > 0) {
      return res.status(400).json({
        success: false,
        error: "Template cannot be deleted as it has associated reports",
      });
    }

    await template.remove();

    res.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete template",
    });
  }
});

// @desc    Clone template
// @route   POST /api/templates/:id/clone
// @access  Private
const cloneTemplate = asyncHandler(async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "New template name is required",
      });
    }

    const original = await ReportTemplate.findById(req.params.id);
    if (!original) {
      return res.status(404).json({
        success: false,
        error: "Template not found",
      });
    }

    // Create new version
    const versionParts = original.version.split(".").map(Number);
    versionParts[1] += 1; // Increment minor version

    const template = new ReportTemplate({
      ...original.toObject(),
      _id: undefined,
      name,
      version: versionParts.join("."),
      isSystemTemplate: false,
      metadata: {
        ...original.metadata,
        clonedFrom: original._id,
        author: req.user.name,
        clonedAt: new Date(),
      },
    });

    await template.save();

    res.status(201).json({
      success: true,
      message: "Template cloned successfully",
      data: template,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Template with this name already exists",
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to clone template",
    });
  }
});

module.exports = {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  toggleTemplateStatus,
  deleteTemplate,
  cloneTemplate,
};
