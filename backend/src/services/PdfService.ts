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
    // Proper small caps: lowercase letters become smaller uppercase, uppercase stays same size
    return text.split('').map(char => {
      if (char >= 'a' && char <= 'z') {
        return char.toUpperCase(); // Will be rendered smaller via font size adjustment
      }
      return char;
    }).join('');
  }

  private getIndexCardTitleSize(cardWidthInches: number, cardHeightInches: number): number {
    // Same size as body since title will be bold - reduced slightly
    const titleSizeInches = cardHeightInches / 18; // Reduced from /15
    return Math.round(titleSizeInches * 72); // Convert to points
  }

  private getIndexCardBodySize(cardWidthInches: number, cardHeightInches: number): number {
    // Calculate body size based on card dimensions - reduced slightly  
    const bodySizeInches = cardHeightInches / 18; // Reduced from /15
    return Math.round(bodySizeInches * 72); // Convert to points
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
    
    // Draw title and body text
    if (isFront) {
      // Front cards: separate title and body as before
      if (title) {
        const titleText = this.toSmallCaps(title);
        doc.fontSize(titleSize)
           .font(fontName + '-Bold')
           .text(titleText, innerX, innerY, {
             width: innerWidth,
             height: titleSize + 8,
             align: 'center'
           });
      }

      if (body) {
        const titleHeight = title ? titleSize + 12 : 0;
        const bodyY = title ? innerY + titleHeight : innerY;
        const availableHeight = innerHeight - titleHeight;

        let textY = bodyY;
        const avgCharsPerLine = Math.floor(innerWidth / (bodySize * 0.6));
        const estimatedLines = Math.ceil(body.length / avgCharsPerLine);
        const lineHeight = bodySize * 1.2;
        const textHeight = estimatedLines * lineHeight;
        textY = bodyY + Math.max(0, (availableHeight - textHeight) / 2);

        const bodyText = this.toSmallCaps(body);
        doc.fontSize(bodySize)
           .font(fontName)
           .text(bodyText, innerX, textY, {
             width: innerWidth,
             height: availableHeight,
             align: 'center',
             lineGap: Math.max(1, bodySize * 0.1)
           });
      }
    } else {
      // Back cards: title inline with first line of body, separated by " | "
      let combinedText = '';
      if (title && body) {
        combinedText = `${this.toSmallCaps(title)} | ${this.toSmallCaps(body)}`;
      } else if (title) {
        combinedText = this.toSmallCaps(title);
      } else if (body) {
        combinedText = this.toSmallCaps(body);
      }

      if (combinedText) {
        doc.fontSize(bodySize)
           .font(fontName)
           .text(combinedText, innerX, innerY, {
             width: innerWidth,
             height: innerHeight,
             align: 'left',
             lineGap: Math.max(1, bodySize * 0.1)
           });
      }
    }
  }

  async generatePdf(options: PdfGenerationOptions): Promise<Buffer> {
    const { cardIds, duplex, titleSize: providedTitleSize, bodySize: providedBodySize, marginMm } = options;
    
    // Get cards from database
    const cards = await this.cardService.getCardsByIds(cardIds);
    
    // Pad to multiple of 4 (4 cards per page now)
    while (cards.length % 4 !== 0) {
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

    // Page dimensions in inches, converted to points (72 DPI)
    const pageWidthInches = 11;
    const pageHeightInches = 8.5;
    const cardWidthInches = 5;
    const cardHeightInches = 3;
    const pageMarginInches = 0.5;
    
    // Calculate dynamic font sizes based on card dimensions, or use provided ones
    const titleSize = providedTitleSize || this.getIndexCardTitleSize(cardWidthInches, cardHeightInches);
    const bodySize = providedBodySize || this.getIndexCardBodySize(cardWidthInches, cardHeightInches);
    
    // Convert to pixels at 72 DPI
    const pageWidth = this.inToPx(pageWidthInches);
    const pageHeight = this.inToPx(pageHeightInches);
    const cardWidth = this.inToPx(cardWidthInches);
    const cardHeight = this.inToPx(cardHeightInches);
    const marginX = this.inToPx(pageMarginInches);
    const marginY = this.inToPx((pageHeightInches - 2 * cardHeightInches) / 2); // Center cards vertically
    const marginPx = this.mmToPx(marginMm);

    // Card positions on page (5x3 cards, 4 per page in 2x2 layout)
    const positions: CardPosition[] = [
      { x: marginX, y: marginY, width: cardWidth, height: cardHeight },
      { x: pageWidth - marginX - cardWidth, y: marginY, width: cardWidth, height: cardHeight },
      { x: marginX, y: pageHeight - marginY - cardHeight, width: cardWidth, height: cardHeight },
      { x: pageWidth - marginX - cardWidth, y: pageHeight - marginY - cardHeight, width: cardWidth, height: cardHeight }
    ];

    // Back position mapping based on duplex mode (for 4 cards)
    const backMapping = duplex === 'long' ? [1, 0, 3, 2] : [2, 3, 0, 1];

    for (let i = 0; i < cards.length; i += 4) {
      const pageCards = cards.slice(i, i + 4);
      
      // Draw front page
      if (i > 0) doc.addPage();
      
      // Add cut lines for 2x2 grid
      // Vertical line
      doc.moveTo(pageWidth / 2, marginY)
         .lineTo(pageWidth / 2, pageHeight - marginY)
         .stroke('#000000')
         .lineWidth(1);
      
      // Horizontal line
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
            true // Is front card
          );
        }
      });

      // Draw back page
      doc.addPage();
      
      // Add cut lines for back page (same as front)
      // Vertical line
      doc.moveTo(pageWidth / 2, marginY)
         .lineTo(pageWidth / 2, pageHeight - marginY)
         .stroke('#000000')
         .lineWidth(1);
      
      // Horizontal line
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
