// services/pdfGenerator.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

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

// proffesional pdfGenerator
/*
async function generateProfessionalPDF(report) {
  let browser;
  try {
    if (!report || !report.sections) {
      throw new Error("Invalid report format - missing sections");
    }

    const fileName = `professional_report_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, "../public/reports", fileName);

    // Register Handlebars helpers
    Handlebars.registerHelper("formatDate", function (date) {
      return new Date(date).toLocaleDateString();
    });

    // Generate HTML content
    const template = Handlebars.compile(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333; }
          .cover-page { text-align: center; padding: 50px 20px; }
          .cover-title { font-size: 24px; margin-bottom: 10px; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .section-title { font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .page-break { page-break-after: always; }
          @page { margin: 20mm; }
        </style>
      </head>
      <body>
        <div class="cover-page">
          <h1 class="cover-title">{{report.title}}</h1>
          <p>Prepared for: {{report.metadata.client}}</p>
          <p>Generated on: {{formatDate report.metadata.generatedAt}}</p>
        </div>

        {{#each report.sections as |section|}}
          <div class="section">
            <h2 class="section-title">{{section.title}}</h2>
            <div>{{{section.content}}}</div>
          </div>
          {{#if section.pageBreak}}<div class="page-break"></div>{{/if}}
        {{/each}}
      </body>
      </html>
    `);

    const html = template({ report });

    // Launch puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Generate PDF
    await page.pdf({
      path: filePath,
      format: "A4",
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
      printBackground: true,
    });

    return `/reports/${fileName}`;
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
*/

async function generateProfessionalPDF(report) {
  let browser;
  try {
    if (!report || !report.sections) {
      throw new Error("Invalid report format - missing sections");
    }

    const fileName = `professional_report_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, "../public/reports", fileName);

    // Generate complete HTML document
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          line-height: 1.6;
        }
        .cover-page {
          text-align: center;
          padding: 50px 20px;
        }
        .cover-title {
          font-size: 24px;
          margin-bottom: 10px;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 18px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f5f5f5;
        }
        .page-break {
          page-break-after: always;
        }
      </style>
    </head>
    <body>
      <div class="cover-page">
        <h1 class="cover-title">${report.title}</h1>
        <p>Prepared for: ${report.metadata?.client || "Client"}</p>
        <p>Generated on: ${new Date(
          report.metadata?.generatedAt || Date.now()
        ).toLocaleDateString()}</p>
      </div>
    `;

    // Add each section
    report.sections.forEach((section) => {
      if (!section || !section.title) return;

      html += `
      <div class="section" style="margin-bottom: ${
        section.styles?.margin || 30
      }px;">
        <h2 class="section-title" style="font-size: ${
          section.styles?.titleFontSize || 18
        }px;">
          ${section.title}
        </h2>
        <div style="font-size: ${section.styles?.contentFontSize || 14}px;">
          ${section.content}
        </div>
      </div>
      `;

      if (section.pageBreak) {
        html += '<div class="page-break"></div>';
      }
    });

    html += `</body></html>`;

    // Launch puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Generate PDF
    await page.pdf({
      path: filePath,
      format: "A4",
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
      printBackground: true,
    });

    return `/reports/${fileName}`;
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  generatePDF,
  generateProfessionalPDF,
};
