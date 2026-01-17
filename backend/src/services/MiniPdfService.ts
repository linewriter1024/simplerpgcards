import PDFDocument from "pdfkit";
import { MiniPlacement, SheetSettings } from "../entities/MiniSheet";
import { Mini } from "../entities/Mini";

export interface MiniSheetPdfData {
  placements: MiniPlacement[];
  settings: SheetSettings;
  minis: Map<string, Mini>;
}

export class MiniPdfService {
  private inchesToPt(inches: number): number {
    // 1 inch = 72 points
    return inches * 72;
  }

  async generateSheetPdf(data: MiniSheetPdfData): Promise<Buffer> {
    const { placements, settings, minis } = data;

    // Create PDF with page size in points (inches * 72)
    const pageWidthPt = this.inchesToPt(settings.pageWidth);
    const pageHeightPt = this.inchesToPt(settings.pageHeight);

    const doc = new PDFDocument({
      size: [pageWidthPt, pageHeightPt],
      margin: 0,
      autoFirstPage: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    // Draw each placement
    for (const placement of placements) {
      const mini = minis.get(placement.miniId);
      if (!mini || !mini.imageData) continue;

      // Calculate position and size in points
      const widthPt = this.inchesToPt(placement.width);
      const heightPt = this.inchesToPt(placement.height);
      const xPt = this.inchesToPt(placement.x);
      const yPt = this.inchesToPt(placement.y);

      // Draw front image
      await this.drawRectangularImage(
        doc,
        mini.imageData,
        xPt,
        yPt,
        widthPt,
        heightPt,
      );

      // Draw text label if present
      if (placement.text) {
        this.drawPlacementText(doc, placement, xPt, yPt, widthPt, heightPt);
      }

      // Handle back side if needed
      if (placement.backMode === "back-image") {
        // Position back side to the right of front with small gap
        const gapPt = this.inchesToPt(0.1); // 0.1 inch gap
        const backXPt = xPt + widthPt + gapPt;

        // Use back image if available, fall back to front
        const backImageData = mini.backImageData || mini.imageData;

        if (backImageData) {
          await this.drawRectangularImage(
            doc,
            backImageData,
            backXPt,
            yPt,
            widthPt,
            heightPt,
          );

          // Draw text on back side too
          if (placement.text) {
            this.drawPlacementText(
              doc,
              placement,
              backXPt,
              yPt,
              widthPt,
              heightPt,
            );
          }
        }
      }
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
