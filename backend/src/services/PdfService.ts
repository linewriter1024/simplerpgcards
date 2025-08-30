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

  private inToPx(inches: number, dpi: number = 72): number {
    return Math.round(inches * dpi);
  }

  private mmToPx(mm: number, dpi: number = 72): number {
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
    isFront: boolean = false
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

    // Use monospace font
    const fontName = 'Courier';
    
    // Draw title
    if (title) {
      doc.fontSize(titleSize)
         .font(fontName + '-Bold')
         .text(title, innerX, innerY, {
           width: innerWidth,
           height: titleSize + 8, // Smaller spacing for index cards
           align: isFront ? 'center' : 'left'
         });
    }

    // Draw body text
    if (body) {
      const titleHeight = title ? titleSize + 12 : 0; // Less spacing after title for index cards
      const bodyY = title ? innerY + titleHeight : innerY;
      const availableHeight = innerHeight - titleHeight;

      let textY = bodyY;
      
      // For front cards, center both horizontally and vertically
      if (isFront) {
        // Better estimation for index card fonts
        const avgCharsPerLine = Math.floor(innerWidth / (bodySize * 0.6));
        const estimatedLines = Math.ceil(body.length / avgCharsPerLine);
        const lineHeight = bodySize * 1.2; // Tighter line spacing for index cards
        const textHeight = estimatedLines * lineHeight;
        textY = bodyY + Math.max(0, (availableHeight - textHeight) / 2);
      }

      doc.fontSize(bodySize)
         .font(fontName)
         .text(body, innerX, textY, {
           width: innerWidth,
           height: availableHeight,
           align: isFront ? 'center' : 'left',
           lineGap: Math.max(1, bodySize * 0.1) // Tighter line gap for index cards
         });
    }
  }

  async generatePdf(options: PdfGenerationOptions): Promise<Buffer> {
    const { cardIds, duplex, titleSize, bodySize, marginMm } = options;
    
    // Get cards from database
    const cards = await this.cardService.getCardsByIds(cardIds);
    
    // Pad to multiple of 6 (6 cards per page now)
    while (cards.length % 6 !== 0) {
      cards.push({
        id: '_blank',
        title: '',
        frontText: '',
        backText: '',
      } as Card);
    }

    const doc = new PDFDocument({ 
      size: 'LETTER', // Use standard letter size
      layout: 'landscape',
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    const pageWidth = 792; // 11 inches at 72 DPI
    const pageHeight = 612; // 8.5 inches at 72 DPI
    const cardWidth = 216; // 3 inches at 72 DPI (index card width)
    const cardHeight = 360; // 5 inches at 72 DPI (index card height)
    const marginX = 36; // 0.5 inches at 72 DPI
    const marginY = 36; // 0.5 inches at 72 DPI (smaller margins for more cards per page)
    const marginPx = this.mmToPx(marginMm);

    // Card positions on page (3x5 cards, 6 per page in 2x3 layout)
    const positions: CardPosition[] = [
      { x: marginX, y: marginY, width: cardWidth, height: cardHeight },
      { x: marginX + cardWidth + marginX, y: marginY, width: cardWidth, height: cardHeight },
      { x: marginX + 2 * (cardWidth + marginX), y: marginY, width: cardWidth, height: cardHeight },
      { x: marginX, y: marginY + cardHeight + marginY, width: cardWidth, height: cardHeight },
      { x: marginX + cardWidth + marginX, y: marginY + cardHeight + marginY, width: cardWidth, height: cardHeight },
      { x: marginX + 2 * (cardWidth + marginX), y: marginY + cardHeight + marginY, width: cardWidth, height: cardHeight }
    ];

    // Back position mapping based on duplex mode (for 6 cards)
    const backMapping = duplex === 'long' ? [2, 1, 0, 5, 4, 3] : [3, 4, 5, 0, 1, 2];

    for (let i = 0; i < cards.length; i += 6) {
      const pageCards = cards.slice(i, i + 6);
      
      // Draw front page
      if (i > 0) doc.addPage();
      
      // Add cut lines for 3x2 grid
      // Vertical lines
      doc.moveTo(marginX + cardWidth, marginY)
         .lineTo(marginX + cardWidth, pageHeight - marginY)
         .stroke('#000000')
         .lineWidth(1);
      
      doc.moveTo(marginX + 2 * cardWidth + marginX, marginY)
         .lineTo(marginX + 2 * cardWidth + marginX, pageHeight - marginY)
         .stroke('#000000')
         .lineWidth(1);
      
      // Horizontal line
      doc.moveTo(marginX, marginY + cardHeight)
         .lineTo(pageWidth - marginX, marginY + cardHeight)
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
            true // Is front card
          );
        }
      });

      // Draw back page
      doc.addPage();
      
      // Add cut lines for back page (same as front)
      // Vertical lines
      doc.moveTo(marginX + cardWidth, marginY)
         .lineTo(marginX + cardWidth, pageHeight - marginY)
         .stroke('#000000')
         .lineWidth(1);
      
      doc.moveTo(marginX + 2 * cardWidth + marginX, marginY)
         .lineTo(marginX + 2 * cardWidth + marginX, pageHeight - marginY)
         .stroke('#000000')
         .lineWidth(1);
      
      // Horizontal line
      doc.moveTo(marginX, marginY + cardHeight)
         .lineTo(pageWidth - marginX, marginY + cardHeight)
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
            false // Is back card
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
