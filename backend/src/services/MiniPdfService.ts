import PDFDocument from "pdfkit";
import { MiniPlacement, SheetSettings } from "../entities/MiniSheet";
import { Mini } from "../entities/Mini";

export interface MiniSheetPdfData {
  placements: MiniPlacement[];
  settings: SheetSettings;
  minis: Map<string, Mini>;
}

interface PlacementWithPage extends MiniPlacement {
  page: number;
}

export class MiniPdfService {
  private inchesToPt(inches: number): number {
    // 1 inch = 72 points
    return inches * 72;
  }

  /**
   * Organize placements into pages based on their Y position.
   * Each page has a printable height based on margins.
   */
  private organizePlacementsIntoPages(
    placements: MiniPlacement[],
    settings: SheetSettings,
  ): PlacementWithPage[] {
    const printableHeight =
      settings.pageHeight - settings.marginTop - settings.marginBottom;
    const labelMargin = 0.2; // Extra space for labels below minis

    return placements.map((p) => {
      // Calculate page based on the bottom of the placement (including label space)
      const placementBottom = p.y - settings.marginTop + p.height + labelMargin;
      const page = Math.floor(placementBottom / printableHeight);

      return {
        ...p,
        page: Math.max(0, page),
      };
    });
  }

  async generateSheetPdf(data: MiniSheetPdfData): Promise<Buffer> {
    const { placements, settings, minis } = data;

    // Create PDF with page size in points (inches * 72)
    const pageWidthPt = this.inchesToPt(settings.pageWidth);
    const pageHeightPt = this.inchesToPt(settings.pageHeight);

    const doc = new PDFDocument({
      size: [pageWidthPt, pageHeightPt],
      margin: 0,
      autoFirstPage: false,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    // Organize placements into pages
    const placementsWithPages = this.organizePlacementsIntoPages(
      placements,
      settings,
    );

    // Find the maximum page number
    const maxPage = placementsWithPages.reduce(
      (max, p) => Math.max(max, p.page),
      0,
    );

    const printableHeight =
      settings.pageHeight - settings.marginTop - settings.marginBottom;

    // Generate each page
    for (let pageNum = 0; pageNum <= maxPage; pageNum++) {
      doc.addPage({ size: [pageWidthPt, pageHeightPt], margin: 0 });

      // Get placements for this page
      const pagePlacements = placementsWithPages.filter(
        (p) => p.page === pageNum,
      );

      // Draw each placement on this page
      for (const placement of pagePlacements) {
        const mini = minis.get(placement.miniId);
        if (!mini || !mini.imageData) continue;

        // Calculate position and size in points
        const widthPt = this.inchesToPt(placement.width);
        const heightPt = this.inchesToPt(placement.height);
        const xPt = this.inchesToPt(placement.x);
        // Adjust Y position relative to the current page
        const yPt = this.inchesToPt(placement.y - pageNum * printableHeight);

        // Determine which image to use based on backMode
        // "back-image" means this placement should show the back image
        const imageData =
          placement.backMode === "back-image" && mini.backImageData
            ? mini.backImageData
            : mini.imageData;

        // Draw the image
        await this.drawRectangularImage(
          doc,
          imageData,
          xPt,
          yPt,
          widthPt,
          heightPt,
        );

        // Draw text label if present
        if (placement.text) {
          this.drawPlacementText(doc, placement, xPt, yPt, widthPt, heightPt);
        }
      }
    }

    // Handle edge case: no placements at all
    if (placements.length === 0) {
      doc.addPage({ size: [pageWidthPt, pageHeightPt], margin: 0 });
    }

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on("error", reject);
    });
  }

  private async drawRectangularImage(
    doc: InstanceType<typeof PDFDocument>,
    imageData: Buffer,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Promise<void> {
    // Draw the image to fill the rectangular area
    try {
      doc.image(imageData, x, y, {
        width: width,
        height: height,
        fit: [width, height],
        align: "center",
        valign: "center",
      });
    } catch (error) {
      console.error("Error drawing image:", error);
    }

    // Draw a subtle border around the rectangle
    doc
      .rect(x, y, width, height)
      .strokeColor("#cccccc")
      .lineWidth(0.5)
      .stroke();
  }

  private drawPlacementText(
    doc: InstanceType<typeof PDFDocument>,
    placement: MiniPlacement,
    xPt: number,
    yPt: number,
    widthPt: number,
    heightPt: number,
  ): void {
    if (!placement.text) return;

    const fontSize = placement.textSize || 8;
    const textPosition = placement.textPosition || "bottom";
    const centerXPt = xPt + widthPt / 2;

    doc.fontSize(fontSize).font("Helvetica-Bold").fillColor("#000000");

    // Calculate text width for centering
    const textWidth = doc.widthOfString(placement.text);
    const textXPt = centerXPt - textWidth / 2;

    const gapPt = this.inchesToPt(0.05); // 0.05 inch gap for text
    let textYPt: number;
    switch (textPosition) {
      case "top":
        textYPt = yPt - fontSize - gapPt;
        break;
      case "center":
        textYPt = yPt + heightPt / 2 - fontSize / 2;
        break;
      case "bottom":
      default:
        textYPt = yPt + heightPt + gapPt;
        break;
    }

    // Draw white outline/shadow for readability
    doc.fillColor("#ffffff");
    for (let dx = -0.5; dx <= 0.5; dx += 0.5) {
      for (let dy = -0.5; dy <= 0.5; dy += 0.5) {
        if (dx !== 0 || dy !== 0) {
          doc.text(placement.text, textXPt + dx, textYPt + dy, {
            lineBreak: false,
          });
        }
      }
    }

    // Draw the actual text
    doc
      .fillColor("#000000")
      .text(placement.text, textXPt, textYPt, { lineBreak: false });
  }

  async generatePreviewPdf(data: MiniSheetPdfData): Promise<Buffer> {
    // For now, preview is the same as the final PDF
    return this.generateSheetPdf(data);
  }
}
