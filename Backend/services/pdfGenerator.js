// services/pdfGenerator.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

async function generatePDF(title, content) {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `report_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, "../public/reports", fileName);
      const doc = new PDFDocument();

      // Create write stream
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Add content to PDF
      doc.fontSize(20).text(title, { align: "center" });
      doc.moveDown();

      // Add sections
      if (content.sections) {
        content.sections.forEach((section) => {
          doc.fontSize(16).text(section.title, { underline: true });
          doc.moveDown();
          doc.fontSize(12).text(section.content);
          doc.moveDown(2);
        });
      } else {
        // Fallback for full reports
        doc.fontSize(12).text(JSON.stringify(content, null, 2));
      }

      doc.end();

      stream.on("finish", () => {
        resolve(`/reports/${fileName}`);
      });

      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

// proffesional pdfGenerator.js
/*
async function generateProfessionalPDF(report) {
  return new Promise((resolve, reject) => {
    const fileName = `professional_report_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, "../public/reports", fileName);
    const doc = new PDFDocument({ margin: 50 });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Add cover page
    doc.fontSize(20).text(report.title, { align: "center" });
    doc.moveDown(2);
    doc
      .fontSize(12)
      .text(`Prepared for: ${report.metadata.client || "Client"}`, {
        align: "center",
      });
    doc.text(
      `Generated on: ${new Date(
        report.metadata.generatedAt
      ).toLocaleDateString()}`,
      { align: "center" }
    );
    doc.addPage();

    // Add sections
    report.sections.forEach((section) => {
      doc.fontSize(16).text(section.title, { underline: true });
      doc.moveDown();

      // Simple HTML to PDF conversion (for real implementation use a proper library)
      const lines = section.content.split("\n");
      lines.forEach((line) => {
        if (line.startsWith("<h2>")) {
          doc.fontSize(14).text(line.replace(/<[^>]+>/g, ""), { bold: true });
        } else if (line.startsWith("<table")) {
          // Implement table rendering
        } else {
          doc.fontSize(12).text(line.replace(/<[^>]+>/g, ""));
        }
        doc.moveDown();
      });

      if (section.pageBreak) doc.addPage();
    });

    doc.end();
    stream.on("finish", () => resolve(`/reports/${fileName}`));
    stream.on("error", reject);
  });
}
*/
async function generateProfessionalPDF(report) {
  return new Promise((resolve, reject) => {
    if (!report || !report.sections) {
      return reject(new Error("Invalid report format - missing sections"));
    }

    try {
      const fileName = `professional_report_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, "../public/reports", fileName);
      const doc = new PDFDocument({ margin: 50 });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Add cover page with fallbacks
      doc
        .fontSize(20)
        .text(report.title || "Network Design Report", { align: "center" });
      doc.moveDown(2);
      doc
        .fontSize(12)
        .text(`Prepared for: ${report.metadata?.client || "Client"}`, {
          align: "center",
        });
      doc.text(
        `Generated on: ${new Date(
          report.metadata?.generatedAt || Date.now()
        ).toLocaleDateString()}`,
        { align: "center" }
      );
      doc.addPage();

      // Process sections
      report.sections.forEach((section) => {
        if (!section || !section.title) return;

        doc.fontSize(16).text(section.title, { underline: true });
        doc.moveDown();

        const content = section.content || "";
        const lines = content.split("\n");

        lines.forEach((line) => {
          if (line.startsWith("<h2>")) {
            doc.fontSize(14).text(line.replace(/<[^>]+>/g, ""), { bold: true });
          } else if (line.startsWith("<table")) {
            // Implement table rendering
          } else {
            doc.fontSize(12).text(line.replace(/<[^>]+>/g, ""));
          }
          doc.moveDown();
        });

        if (section.pageBreak) doc.addPage();
      });

      doc.end();
      stream.on("finish", () => resolve(`/reports/${fileName}`));
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}
module.exports = {
  generatePDF,
  generateProfessionalPDF,
};
