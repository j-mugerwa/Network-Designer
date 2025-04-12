// controllers/reportController.js
const asyncHandler = require("express-async-handler");
const NetworkDesign = require("../models/NetworkDesignModel");
const NetworkReport = require("../models/ReportModel");
const ReportTemplate = require("../models/ReportTemplateModel");
const ReportGenerator = require("../services/reportGenerator");
const { generateProfessionalPDF } = require("../services/pdfGenerator"); // You'll need to implement this
const generatePDF = require("../services/pdfGenerator");
// @desc    Generate a full network design report
// @route   POST /api/reports/full/:designId
// @access  Private
const generateFullReport = asyncHandler(async (req, res) => {
  try {
    const design = await NetworkDesign.findOne({
      _id: req.params.designId,
      userId: req.user._id,
    }).populate("devices");

    if (!design) {
      return res.status(404).json({
        success: false,
        error: "Design not found or access denied",
      });
    }

    const reportContent = await ReportGenerator.generateFullReport(design);

    // Generate PDF (implementation depends on your PDF library)
    const pdfUrl = await generatePDF(
      "Full Network Design Report",
      reportContent
    );

    const report = await NetworkReport.create({
      designId: design._id,
      userId: req.user._id,
      reportType: "full",
      title: `${design.designName} - Full Report`,
      content: reportContent,
      format: "pdf",
      downloadUrl: pdfUrl,
    });

    res.json({
      success: true,
      message: "Full report generated successfully",
      data: report,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate report",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// controllers/reportController.js
const generateProfessionalReport = asyncHandler(async (req, res) => {
  try {
    const design = await NetworkDesign.findOne({
      _id: req.params.designId,
      userId: req.user._id,
    }).populate("devices");

    if (!design) {
      return res.status(404).json({
        success: false,
        error: "Design not found or access denied",
      });
    }

    const reportContent = await ReportGenerator.generateProfessionalReport(
      design
    );
    //const pdfUrl = await generatePDF(reportContent);

    const pdfUrl = await generateProfessionalPDF(reportContent);

    const report = await NetworkReport.create({
      designId: design._id,
      userId: req.user._id,
      reportType: "professional",
      title: reportContent.title,
      content: reportContent,
      format: "pdf",
      downloadUrl: pdfUrl,
    });

    // Return both JSON and PDF options
    res.json({
      success: true,
      message: "Professional report generated successfully",
      data: {
        reportId: report._id,
        pdfUrl: pdfUrl,
        structuredData: reportContent, // For API consumers
      },
    });
  } catch (error) {
    console.error("Professional report error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate professional report",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @desc    Generate report from template
// @route   POST /api/reports/template
// @access  Private
const generateFromTemplate = asyncHandler(async (req, res) => {
  try {
    const { designId, templateId, format = "pdf" } = req.body;

    const [design, template] = await Promise.all([
      NetworkDesign.findOne({
        _id: designId,
        userId: req.user._id,
      }),
      ReportTemplate.findById(templateId),
    ]);

    if (!design || !template) {
      return res.status(404).json({
        success: false,
        error: "Design or template not found",
      });
    }

    if (!template.supportedFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        error: `Format ${format} not supported for this template`,
      });
    }

    const reportContent = await ReportGenerator.generateFromTemplate(
      design,
      template,
      req.user // Pass the user for metadata
    );

    let fileUrl;

    if (format === "pdf") {
      // Use professional PDF generator for templates
      fileUrl = await generateProfessionalPDF(reportContent);
    } else {
      // Implement other format generators as needed
      fileUrl = `/reports/${Date.now()}.${format}`;
    }

    const report = await NetworkReport.create({
      designId: design._id,
      userId: req.user._id,
      reportType: "custom",
      templateId: template._id,
      title: reportContent.title,
      content: reportContent,
      format,
      downloadUrl: fileUrl,
    });

    res.json({
      success: true,
      message: "Report generated successfully",
      data: report,
    });
  } catch (error) {
    console.error("Template report error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate template report",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @desc    Get all reports for a design
// @route   GET /api/reports/design/:designId
// @access  Private
const getDesignReports = asyncHandler(async (req, res) => {
  try {
    const reports = await NetworkReport.find({
      designId: req.params.designId,
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch reports",
    });
  }
});

// @desc    Get report details
// @route   GET /api/reports/:reportId
// @access  Private
const getReport = asyncHandler(async (req, res) => {
  try {
    const report = await NetworkReport.findOne({
      _id: req.params.reportId,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found",
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch report",
    });
  }
});

module.exports = {
  generateFullReport,
  generateProfessionalReport,
  generateFromTemplate,
  getDesignReports,
  getReport,
};
