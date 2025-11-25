import PDFDocument from "pdfkit";

export interface PDFExportOptions {
  title: string;
  filters?: Record<string, any>;
  summary?: Record<string, any>;
  headers: string[];
  rows: any[][];
  maxRows?: number;
}

// Helper function to safely set font with fallback
function safeFont(doc: PDFDocument, fontName: string, fallback: string = "Helvetica") {
  try {
    doc.font(fontName);
  } catch (error: any) {
    // If font loading fails (e.g., ENOENT error), use fallback
    if (error.code === "ENOENT" || error.message?.includes("ENOENT") || error.message?.includes("no such file")) {
      console.warn(`Font ${fontName} not available, using ${fallback}`);
      try {
        doc.font(fallback);
      } catch {
        // If fallback also fails, PDFKit will use default font
      }
    } else {
      throw error;
    }
  }
}

export function generatePDF(options: PDFExportOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Configure PDFKit to use only built-in fonts (no external font files)
      // This prevents ENOENT errors when font files are not available
      const doc = new PDFDocument({ 
        margin: 50,
        autoFirstPage: true
      });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => {
        buffers.push(chunk);
      });
      doc.on("end", () => {
        try {
          const pdfBuffer = Buffer.concat(buffers);
          if (pdfBuffer.length === 0) {
            reject(new Error("Generated PDF buffer is empty"));
            return;
          }
          resolve(pdfBuffer);
        } catch (error) {
          reject(new Error(`Failed to concatenate PDF buffers: ${error instanceof Error ? error.message : String(error)}`));
        }
      });
      doc.on("error", (error: Error) => {
        // Check if it's a font loading error
        if (error.message?.includes("ENOENT") || error.message?.includes("no such file") || error.message?.includes(".afm")) {
          console.warn("PDFKit font loading error caught:", error.message);
          // Don't reject immediately - try to continue with default fonts
          // The error handler will catch this, but we'll try to continue
        } else {
          reject(new Error(`PDF generation error: ${error.message || String(error)}`));
        }
      });

    // Title - use safe font loading
    doc.fontSize(20);
    safeFont(doc, "Helvetica-Bold", "Helvetica");
    doc.text(options.title, { align: "center" });
    doc.moveDown();

    // Filters summary
    if (options.filters && Object.keys(options.filters).length > 0) {
      doc.fontSize(12);
      safeFont(doc, "Helvetica-Bold", "Helvetica");
      doc.text("Filters:", { underline: true });
      safeFont(doc, "Helvetica");
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
          doc.fontSize(10).text(`${label}: ${String(value)}`);
        }
      });
      doc.moveDown();
    }

    // Summary KPIs
    if (options.summary && Object.keys(options.summary).length > 0) {
      doc.fontSize(12);
      safeFont(doc, "Helvetica-Bold", "Helvetica");
      doc.text("Summary:", { underline: true });
      safeFont(doc, "Helvetica");
      Object.entries(options.summary).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
        doc.fontSize(10).text(`${label}: ${String(value)}`);
      });
      doc.moveDown(2);
    }

    // Table
    if (options.headers.length > 0 && options.rows.length > 0) {
      doc.fontSize(12);
      safeFont(doc, "Helvetica-Bold", "Helvetica");
      doc.text("Data:", { underline: true });
      doc.moveDown(0.5);

      const maxRows = options.maxRows || 100;
      const rowsToShow = options.rows.slice(0, maxRows);
      const hasMore = options.rows.length > maxRows;

      // Table headers
      doc.fontSize(9);
      safeFont(doc, "Helvetica-Bold", "Helvetica");
      const startX = 50;
      const rowHeight = 20;
      let currentY = doc.y;
      const colWidth = (doc.page.width - 100) / options.headers.length;

      options.headers.forEach((header, i) => {
        doc.text(header, startX + i * colWidth, currentY, {
          width: colWidth - 5,
          align: "left",
        });
      });

      // Draw line under headers
      doc.moveTo(startX, currentY + 15).lineTo(doc.page.width - 50, currentY + 15).stroke();
      currentY += rowHeight;

      // Table rows
      safeFont(doc, "Helvetica");
      doc.fontSize(8);
      rowsToShow.forEach((row) => {
        if (currentY > doc.page.height - 50) {
          doc.addPage();
          currentY = 50;
        }

        row.forEach((cell, i) => {
          const cellValue = cell !== null && cell !== undefined ? String(cell) : "";
          doc.text(cellValue, startX + i * colWidth, currentY, {
            width: colWidth - 5,
            align: "left",
          });
        });

        currentY += rowHeight;
      });

      if (hasMore) {
        doc.moveDown();
        doc.fontSize(9);
        safeFont(doc, "Helvetica-Oblique", "Helvetica");
        doc.text(
          `Note: Showing first ${maxRows} rows. Total rows: ${options.rows.length}`,
          { align: "center" }
        );
      }
    } else {
      doc.fontSize(10).text("No data available", { align: "center" });
    }

    // Footer
    try {
      doc.fontSize(8);
      safeFont(doc, "Helvetica-Oblique", "Helvetica");
      const footerY = doc.page.height - 30;
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        50,
        footerY,
        { 
          width: doc.page.width - 100,
          align: "center" 
        }
      );
    } catch (footerError) {
      // If footer fails, log but don't fail the whole PDF
      console.warn("Failed to add footer to PDF:", footerError);
    }

    try {
      doc.end();
    } catch (endError) {
      reject(new Error(`Failed to finalize PDF: ${endError instanceof Error ? endError.message : String(endError)}`));
    }
    } catch (error) {
      reject(new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
}

