import PDFDocument from 'pdfkit';
import { Card } from '../entities/Card';
import { PdfGenerationOptions } from '../types/card.types';
import { CardService } from './CardService';

interface CardPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PdfService {
  private cardService: CardService;

  constructor() {
    this.cardService = new CardService();
  }

  private inToPx(inches: number, dpi: number = 300): number {
    return Math.round(inches * dpi);
  }

  private mmToPx(mm: number, dpi: number = 300): number {
    return Math.round(mm / 25.4 * dpi);
  }

  private toSmallCaps(text: string): string {
    return text.toUpperCase();
  }

  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    // Simple word wrapping - estimate character width
    const avgCharWidth = fontSize * 0.6;
    const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
  }

  private drawCard(
    doc: InstanceType<typeof PDFDocument>,
    position: CardPosition,
    title: string,
    body: string,
    titleSize: number,
    bodySize: number,
    marginPx: number,
    centerVertically: boolean = false
  ): void {
    const { x, y, width, height } = position;
    
    // Draw border
    doc.rect(x, y, width, height)
       .stroke('#000000')
       .lineWidth(2);

    // Calculate inner bounds
    const innerX = x + marginPx;
    const innerY = y + marginPx;
    const innerWidth = width - 2 * marginPx;
    const innerHeight = height - 2 * marginPx;

    // Draw title
    const titleText = this.toSmallCaps(title);
    if (titleText) {
      doc.fontSize(titleSize)
         .font('Helvetica-Bold')
         .text(titleText, innerX, innerY, {
           width: innerWidth,
           height: titleSize + 5,
           align: 'left'
         });
    }

    // Draw body text
    const bodyText = this.toSmallCaps(body);
    if (bodyText) {
      const bodyY = titleText ? innerY + titleSize + marginPx : innerY;
      const availableHeight = innerHeight - (titleText ? titleSize + marginPx : 0);

      let textY = bodyY;
      if (centerVertically) {
        // Estimate text height for centering
        const estimatedLines = Math.ceil(bodyText.length / (innerWidth / (bodySize * 0.6)));
        const textHeight = estimatedLines * bodySize * 1.2;
        textY = bodyY + (availableHeight - textHeight) / 2;
      }

      doc.fontSize(bodySize)
         .font('Helvetica')
         .text(bodyText, innerX, textY, {
           width: innerWidth,
           height: availableHeight,
           align: 'left',
           lineGap: 4
         });
    }
  }

  async generatePdf(options: PdfGenerationOptions): Promise<Buffer> {
    const { cardIds, duplex, titleSize, bodySize, marginMm } = options;
    
    // Get cards from database
    const cards = await this.cardService.getCardsByIds(cardIds);
    
    // Pad to multiple of 4
    while (cards.length % 4 !== 0) {
      cards.push({
        id: '_blank',
        title: '',
        frontText: '',
        backText: '',
      } as Card);
    }

    const doc = new PDFDocument({ 
      size: [this.inToPx(11), this.inToPx(8.5)], // Landscape Letter
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    const pageWidth = this.inToPx(11);
    const pageHeight = this.inToPx(8.5);
    const cardWidth = this.inToPx(5);
    const cardHeight = this.inToPx(3);
    const marginX = this.inToPx(0.5);
    const marginY = this.inToPx(1.25);
    const marginPx = this.mmToPx(marginMm);

    // Card positions on page
    const positions: CardPosition[] = [
      { x: marginX, y: marginY, width: cardWidth, height: cardHeight },
      { x: pageWidth - marginX - cardWidth, y: marginY, width: cardWidth, height: cardHeight },
      { x: marginX, y: pageHeight - marginY - cardHeight, width: cardWidth, height: cardHeight },
      { x: pageWidth - marginX - cardWidth, y: pageHeight - marginY - cardHeight, width: cardWidth, height: cardHeight }
    ];

    // Back position mapping based on duplex mode
    const backMapping = duplex === 'long' ? [1, 0, 3, 2] : [2, 3, 0, 1];

    for (let i = 0; i < cards.length; i += 4) {
      const pageCards = cards.slice(i, i + 4);
      
      // Draw front page
      if (i > 0) doc.addPage();
      
      // Add cut lines
      doc.moveTo(pageWidth / 2, marginY)
         .lineTo(pageWidth / 2, pageHeight - marginY)
         .stroke('#000000')
         .lineWidth(1);
      
      doc.moveTo(marginX, pageHeight / 2)
         .lineTo(pageWidth - marginX, pageHeight / 2)
         .stroke('#000000')
         .lineWidth(1);

      // Draw front sides
      pageCards.forEach((card, index) => {
        if (card.title || card.frontText) {
          this.drawCard(
            doc,
            positions[index],
            card.title || '',
            card.frontText || '',
            titleSize,
            bodySize,
            marginPx,
            true // Center vertically for front
          );
        }
      });

      // Draw back page
      doc.addPage();
      
      // Add cut lines for back page
      doc.moveTo(pageWidth / 2, marginY)
         .lineTo(pageWidth / 2, pageHeight - marginY)
         .stroke('#000000')
         .lineWidth(1);
      
      doc.moveTo(marginX, pageHeight / 2)
         .lineTo(pageWidth - marginX, pageHeight / 2)
         .stroke('#000000')
         .lineWidth(1);

      // Draw back sides (with proper mapping for duplex)
      pageCards.forEach((card, index) => {
        const backIndex = backMapping[index];
        if (card.title || card.backText) {
          this.drawCard(
            doc,
            positions[backIndex],
            card.title || '',
            card.backText || '',
            titleSize,
            bodySize,
            marginPx,
            false // Top-aligned for back
          );
        }
      });
    }

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);
    });
  }
}
