import PDFDocument from "pdfkit";

export interface PDFExportOptions {
  title: string;
  filters?: Record<string, any>;
  summary?: Record<string, any>;
  headers: string[];
  rows: any[][];
  maxRows?: number;
}

// Helper function to safely set font - only use built-in fonts that don't require external files
// PDFKit built-in fonts: Helvetica, Times-Roman, Courier (and their variants)
// We'll use only base fonts and apply styling manually to avoid ENOENT errors
function safeFont(doc: InstanceType<typeof PDFDocument>, fontName: string, fallback: string = "Helvetica") {
  try {
    // Map font variants to base fonts to avoid file loading
    const fontMap: Record<string, string> = {
      "Helvetica": "Helvetica",
      "Helvetica-Bold": "Helvetica", // Use base font, we'll make it bold via styling
      "Helvetica-Oblique": "Helvetica", // Use base font, we'll make it italic via styling
      "Times-Roman": "Times-Roman",
      "Courier": "Courier",
    };
    
    const baseFont = fontMap[fontName] || fontMap[fallback] || "Helvetica";
    doc.font(baseFont);
    
    // Apply styling for bold/italic variants
    if (fontName.includes("Bold")) {
      // PDFKit doesn't have built-in bold, but we can use larger font or underline
      // For now, just use regular font
    }
    if (fontName.includes("Oblique") || fontName.includes("Italic")) {
      // PDFKit doesn't have built-in italic, use regular font
    }
  } catch (error: any) {
    // If font loading fails, use fallback
    try {
      doc.font(fallback);
    } catch {
      // If fallback also fails, PDFKit will use default font
    }
  }
}

export function generatePDF(options: PDFExportOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Validate inputs
      if (!options.headers || options.headers.length === 0) {
        reject(new Error("PDF generation failed: Headers are required"));
        return;
      }

      // Configure PDFKit to use only built-in fonts (no external font files)
      // This prevents ENOENT errors when font files are not available
      const doc = new PDFDocument({ 
        margin: 50,
        autoFirstPage: true,
        size: "A4"
      });
      const buffers: Buffer[] = [];
      let hasError = false;

      doc.on("data", (chunk: Buffer) => {
        buffers.push(chunk);
      });
      
      doc.on("end", () => {
        if (hasError) {
          return; // Error already handled
        }
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
        hasError = true;
        // Check if it's a font loading error
        if (error.message?.includes("ENOENT") || error.message?.includes("no such file") || error.message?.includes(".afm")) {
          console.warn("PDFKit font loading error caught:", error.message);
          // Try to continue with default fonts, but log the error
        } else {
          reject(new Error(`PDF generation error: ${error.message || String(error)}`));
        }
      });

    // Title - use base font only (no variants that require files)
    doc.fontSize(20);
    doc.font("Helvetica"); // Use only base font
    doc.text(options.title, { align: "center" });
    doc.moveDown();

    // Filters summary
    if (options.filters && Object.keys(options.filters).length > 0) {
      doc.fontSize(12);
      doc.font("Helvetica"); // Use only base font
      doc.text("Filters:", { underline: true });
      doc.font("Helvetica");
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
      doc.font("Helvetica"); // Use only base font
      doc.text("Summary:", { underline: true });
      doc.font("Helvetica");
      Object.entries(options.summary).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
        doc.fontSize(10).text(`${label}: ${String(value)}`);
      });
      doc.moveDown(2);
    }

    // Table
    if (options.headers.length > 0) {
      // Handle case where rows might be empty or undefined
      const rows = options.rows || [];
      doc.fontSize(12);
      doc.font("Helvetica"); // Use only base font
      doc.text("Data:", { underline: true });
      doc.moveDown(0.5);

      if (rows.length > 0) {
        const maxRows = options.maxRows || 100;
        const rowsToShow = rows.slice(0, maxRows);
        const hasMore = rows.length > maxRows;

      // Table headers
      doc.fontSize(9);
      doc.font("Helvetica"); // Use only base font
      const startX = 50;
      const rowHeight = 20;
      let currentY = doc.y;
      const colWidth = Math.max(80, (doc.page.width - 100) / options.headers.length);

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
        doc.font("Helvetica"); // Use only base font
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
          doc.font("Helvetica"); // Use only base font
          doc.text(
            `Note: Showing first ${maxRows} rows. Total rows: ${rows.length}`,
            { align: "center" }
          );
        }
      } else {
        doc.fontSize(10).text("No data available", { align: "center" });
      }
    } else {
      doc.fontSize(10).text("No data available", { align: "center" });
    }

    // Footer
    try {
      doc.fontSize(8);
      doc.font("Helvetica"); // Use only base font
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

