// controllers/reportController.js
const asyncHandler = require("express-async-handler");
const NetworkDesign = require("../models/NetworkDesignModel");
const NetworkReport = require("../models/ReportModel");
const ReportTemplate = require("../models/ReportTemplateModel");
const ReportGenerator = require("../services/reportGenerator");
const { generateProfessionalPDF } = require("../services/pdfGenerator"); // You'll need to implement this
//const generatePDF = require("../services/pdfGenerator");

const path = require("path");
const fs = require("fs");
// @desc    Generate a full network design report
// @route   POST /api/reports/full/:designId
// @access  Private

/*
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
*/

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

    // Generate unique filename
    const timestamp = Date.now();
    const pdfFileName = `professional_report_${timestamp}.pdf`;
    const pdfPath = `/reports/${pdfFileName}`;
    const fullPath = path.join(__dirname, "..", "reports", pdfFileName);

    // Ensure reports directory exists
    if (!fs.existsSync(path.join(__dirname, "..", "reports"))) {
      fs.mkdirSync(path.join(__dirname, "..", "reports"));
    }

    // Generate and save PDF
    await generateProfessionalPDF(reportContent, fullPath);

    const report = await NetworkReport.create({
      designId: design._id,
      userId: req.user._id,
      reportType: "professional",
      title: reportContent.title,
      content: reportContent,
      format: "pdf",
      downloadUrl: pdfPath,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    res.json({
      success: true,
      message: "Professional report generated successfully",
      data: report,
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

// @desc    Download a report
// @route   GET /api/reports/:reportId/download
// @access  Private

/*
const downloadReport = asyncHandler(async (req, res) => {
  try {
    const report = await NetworkReport.findOne({
      _id: req.params.reportId,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found or access denied",
      });
    }

    // Check if downloadUrl is a filesystem path
    if (report.downloadUrl.startsWith("/reports/")) {
      const filePath = path.join(__dirname, "..", report.downloadUrl);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: "Report file not found",
        });
      }

      // Set headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${report.title.replace(/\s+/g, "_")}.pdf"`
      );

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid report file location",
      });
    }
  } catch (error) {
    console.error("Download report error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to download report",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
*/

const downloadReport = asyncHandler(async (req, res) => {
  try {
    const report = await NetworkReport.findOne({
      _id: req.params.reportId,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found or access denied",
      });
    }

    // Construct absolute file path
    const filePath = path.join(__dirname, "..", report.downloadUrl);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: "Report file not found on server",
      });
    }

    // Set headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filePath)}"`
    );

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Download report error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to download report",
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

// @desc    Get all reports for a user
// @route   GET /api/reports/user
// @access  Private
const getUserReports = asyncHandler(async (req, res) => {
  try {
    const reports = await NetworkReport.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "designId",
        select: "designName",
      });

    // Transform the data to include design name in each report
    const transformedReports = reports.map((report) => ({
      id: report._id,
      designId: report.designId._id,
      designName: report.designId.designName,
      userId: report.userId,
      reportType: report.reportType,
      title: report.title,
      format: report.format,
      downloadUrl: report.downloadUrl,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    }));

    res.json({
      success: true,
      count: transformedReports.length,
      data: transformedReports,
    });
  } catch (error) {
    console.error("Get user reports error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user reports",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
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
  //generateFullReport,
  generateProfessionalReport,
  downloadReport,
  generateFromTemplate,
  getDesignReports,
  getUserReports,
  getReport,
};
