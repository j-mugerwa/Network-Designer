// services/pdfGenerator.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

exports.generatePDF = async (content) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Add title
      doc.fontSize(20).text(content.title, { align: "center" });
      doc.moveDown(0.5);

      // Add subtitle
      doc.fontSize(14).text(content.subtitle, { align: "center" });
      doc.moveDown(1);

      // Add metadata table
      doc.fontSize(12);
      const metadataTop = doc.y;
      let metadataLeft = 50;
      let metadataRight = 250;

      Object.entries(content.metadata).forEach(([key, value]) => {
        doc.text(`${key}:`, metadataLeft, doc.y, {
          width: 200,
          continued: true,
        });
        doc.text(value.toString(), metadataRight, doc.y, { width: 300 });
        doc.moveDown(0.7);
      });

      // Add horizontal line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      // Add content sections
      content.content.forEach((section) => {
        switch (section.type) {
          case "heading":
            doc
              .fontSize(14 + (4 - section.level))
              .text(section.text)
              .moveDown(0.5);
            break;

          case "text":
            doc.fontSize(11).text(section.text).moveDown(0.5);
            break;

          case "code":
            doc.font("Courier").fontSize(10);
            const codeHeight = doc.heightOfString(section.text, { width: 500 });
            doc.rect(50, doc.y, 500, codeHeight + 10).fill("#f5f5f5");
            doc.fill("black").text(section.text, 60, doc.y + 5, { width: 480 });
            doc.moveDown(1.5);
            break;

          case "table":
            const tableTop = doc.y;
            const cellPadding = 5;
            const colWidths = [150, 150, 250];

            // Draw header
            doc.font("Helvetica-Bold");
            section.data[0].forEach((cell, i) => {
              doc.text(
                cell,
                50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
                tableTop,
                {
                  width: colWidths[i],
                  padding: cellPadding,
                }
              );
            });

            // Draw rows
            doc.font("Helvetica");
            section.data.slice(1).forEach((row, rowIndex) => {
              const rowTop = tableTop + 20 + rowIndex * 20;
              row.forEach((cell, i) => {
                doc.text(
                  cell,
                  50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
                  rowTop,
                  {
                    width: colWidths[i],
                    padding: cellPadding,
                  }
                );
              });
            });

            doc.moveDown(2);
            break;
        }
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// proffesional pdfGenerator

async function generateProfessionalPDF(report) {
  let browser;
  try {
    if (!report || !report.sections) {
      throw new Error("Invalid report format - missing sections");
    }

    const fileName = `professional_report_${Date.now()}.pdf`;
    //const filePath = path.join(__dirname, "../public/reports", fileName);
    const filePath = path.join(__dirname, "../reports", fileName);

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
  generateProfessionalPDF,
};
