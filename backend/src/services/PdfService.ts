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

  private formatText(text: string): string {
    // Just return the text as-is for regular monospace
    return text;
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
    
    // Draw border - thinner border
    doc.rect(x, y, width, height)
       .stroke('#000000')
       .lineWidth(1);

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
        const titleText = this.formatText(title);
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

        const bodyText = this.formatText(body);
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
      if (title && body) {
        const titleText = this.formatText(title);
        const bodyText = this.formatText(body);
        
        // Use smaller font size for title (0.75x)
        const titleFontSize = Math.round(bodySize * 0.75);
        
        // Calculate how much width the title + separator takes up
        const titleAndSeparator = `${titleText} | `;
        const titleWidth = titleAndSeparator.length * (titleFontSize * 0.6); // Estimate width
        const remainingWidth = innerWidth - titleWidth;
        
        // Wrap body text accounting for the title space on first line
        const avgCharWidth = bodySize * 0.6;
        const firstLineMaxChars = Math.floor(remainingWidth / avgCharWidth);
        const otherLinesMaxChars = Math.floor(innerWidth / avgCharWidth);
        
        // Split body text considering first line width constraint
        const bodyWords = bodyText.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        let isFirstLine = true;
        
        for (const word of bodyWords) {
          const maxChars = isFirstLine ? firstLineMaxChars : otherLinesMaxChars;
          if (currentLine.length + word.length + 1 <= maxChars) {
            currentLine += (currentLine ? ' ' : '') + word;
          } else {
            if (currentLine) {
              lines.push(currentLine);
              isFirstLine = false;
            }
            currentLine = word;
          }
        }
        if (currentLine) lines.push(currentLine);
        
        // Draw the first line with title formatting for title part
        doc.fontSize(titleFontSize)
           .font(fontName + '-Bold')
           .text(titleText + ' | ', innerX, innerY, {
             continued: true,
             lineBreak: false
           });
           
        // Continue with first body line in normal font
        const firstBodyLine = lines[0] || '';
        doc.fontSize(bodySize)
           .font(fontName)
           .text(firstBodyLine, {
             continued: false,
             lineBreak: true
           });
        
        // Draw remaining body lines if any
        const remainingLines = lines.slice(1);
        if (remainingLines.length > 0) {
          const remainingText = remainingLines.join('\n');
          doc.fontSize(bodySize)
             .font(fontName)
             .text(remainingText, innerX, doc.y + Math.max(1, bodySize * 0.1), {
               width: innerWidth,
               align: 'left',
               lineGap: Math.max(1, bodySize * 0.1)
             });
        }
      } else if (title) {
        const titleText = this.formatText(title);
        const titleFontSize = Math.round(bodySize * 0.75);
        doc.fontSize(titleFontSize)
           .font(fontName + '-Bold')
           .text(titleText, innerX, innerY, {
             width: innerWidth,
             height: innerHeight,
             align: 'left',
             lineGap: Math.max(1, bodySize * 0.1)
           });
      } else if (body) {
        const bodyText = this.formatText(body);
        doc.fontSize(bodySize)
           .font(fontName)
           .text(bodyText, innerX, innerY, {
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

    return this.generatePdfFromCards(cards, duplex, providedTitleSize, providedBodySize, marginMm);
  }

  async generatePreviewPdf(cardData: any): Promise<Buffer> {
    // Create a single card for preview - show front and back in column
    const previewCard = {
      id: 'preview',
      title: cardData.title || '',
      frontText: cardData.frontText || '',
      backText: cardData.backText || '',
    } as Card;

    return this.generatePreviewPdfFromCard(previewCard);
  }

  private async generatePreviewPdfFromCard(card: Card): Promise<Buffer> {
    // Card dimensions at half size (2.5×1.5 inches)
    const cardWidthInches = 2.5;
    const cardHeightInches = 1.5;
    const cardWidth = this.inToPx(cardWidthInches);
    const cardHeight = this.inToPx(cardHeightInches);
    
    // Calculate dimensions for custom page size
    const margin = 20;
    const labelHeight = 20; // Space for "FRONT" and "BACK" labels
    const gapBetweenCards = 30;
    const totalCardsHeight = 2 * cardHeight + gapBetweenCards + 2 * labelHeight;
    
    // Custom page size to fit content exactly
    const pageWidth = cardWidth + 2 * margin;
    const pageHeight = totalCardsHeight + 2 * margin;

    const doc = new PDFDocument({ 
      size: [pageWidth, pageHeight], // Custom size to fit content
      layout: 'portrait',
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    // Calculate dynamic font sizes for half-size cards
    const titleSize = this.getIndexCardTitleSize(cardWidthInches, cardHeightInches);
    const bodySize = this.getIndexCardBodySize(cardWidthInches, cardHeightInches);
    const marginPx = this.mmToPx(4.0);
    
    // Center cards horizontally, stack vertically from top
    const centerX = margin;
    const startY = margin + labelHeight;
    
    // Front card position
    const frontPosition: CardPosition = {
      x: centerX,
      y: startY,
      width: cardWidth,
      height: cardHeight
    };
    
    // Back card position
    const backPosition: CardPosition = {
      x: centerX,
      y: startY + cardHeight + gapBetweenCards + labelHeight,
      width: cardWidth,
      height: cardHeight
    };

    // Draw front card with label
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('FRONT', centerX, margin, { width: cardWidth, align: 'center' });
       
    this.drawCard(
      doc,
      frontPosition,
      card.title || '',
      card.frontText || '',
      titleSize,
      bodySize,
      marginPx,
      true // Is front card
    );

    // Draw back card with label
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('BACK', centerX, startY + cardHeight + gapBetweenCards, { width: cardWidth, align: 'center' });
       
    this.drawCard(
      doc,
      backPosition,
      card.title || '',
      card.backText || '',
      titleSize,
      bodySize,
      marginPx,
      false // Is back card
    );

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);
    });
  }

  private async generatePdfFromCards(
    cards: Card[],
    duplex: 'long' | 'short',
    providedTitleSize?: number,
    providedBodySize?: number,
    marginMm: number = 4.0
  ): Promise<Buffer> {
    
    // Get cards from database
    
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
