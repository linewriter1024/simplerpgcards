import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { CardService } from '../services/CardService';
import { PdfService } from '../services/PdfService';
import { CreateCardDto, UpdateCardDto, CardFilter, PdfGenerationOptions } from '../types/card.types';

export class CardController {
  private cardService: CardService;
  private pdfService: PdfService;

  constructor() {
    this.cardService = new CardService();
    this.pdfService = new PdfService();
  }

  async getAllCards(req: Request, res: Response): Promise<void> {
    try {
      const filter: CardFilter = {
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        search: req.query.search as string,
      };

      const cards = await this.cardService.getAllCards(filter);
      
      // Transform cards to include parsed tags
      const transformedCards = cards.map(card => ({
        ...card,
        tags: card.tags ? JSON.parse(card.tags) : []
      }));
      
      res.json(transformedCards);
    } catch (error) {
      console.error('Error fetching cards:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCardById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const card = await this.cardService.getCardById(id);
      
      if (!card) {
        res.status(404).json({ error: 'Card not found' });
        return;
      }

      res.json(card);
    } catch (error) {
      console.error('Error fetching card:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createCard(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const cardData: CreateCardDto = req.body;
      const card = await this.cardService.createCard(cardData);
      res.status(201).json(card);
    } catch (error) {
      console.error('Error creating card:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateCard(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const cardData: UpdateCardDto = req.body;
      const card = await this.cardService.updateCard(id, cardData);
      
      if (!card) {
        res.status(404).json({ error: 'Card not found' });
        return;
      }

      res.json(card);
    } catch (error) {
      console.error('Error updating card:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteCard(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await this.cardService.deleteCard(id);
      
      if (!success) {
        res.status(404).json({ error: 'Card not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting card:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async generatePdf(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const options: PdfGenerationOptions = {
        cardIds: req.body.cardIds || [],
        duplex: req.body.duplex || 'long',
        titleSize: req.body.titleSize || 26,
        bodySize: req.body.bodySize || 18,
        marginMm: req.body.marginMm || 4.0,
      };

      const pdfBuffer = await this.pdfService.generatePdf(options);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=rpg-cards.pdf');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getTags(req: Request, res: Response): Promise<void> {
    try {
      const tags = await this.cardService.getAllTags();
      res.json(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async importCards(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const content = req.file.buffer.toString('utf-8');
      const importedCards = this.parseCardText(content);
      
      const savedCards = [];
      for (const cardData of importedCards) {
        const card = await this.cardService.createCard(cardData);
        savedCards.push(card);
      }

      res.json({ 
        message: `Successfully imported ${savedCards.length} cards`,
        cards: savedCards 
      });
    } catch (error) {
      console.error('Error importing cards:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private parseCardText(content: string): CreateCardDto[] {
    const sections = content.split('=').map(s => s.trim()).filter(s => s);
    const cards: CreateCardDto[] = [];

    for (const section of sections) {
      const parts = section.split('+');
      const frontPart = parts[0]?.trim() || '';
      const backPart = parts[1]?.trim() || '';

      const frontLines = frontPart.split('\n').map(l => l.trim()).filter(l => l);
      if (frontLines.length === 0) continue;

      const title = frontLines[0];
      const frontText = frontLines.slice(1).join('\n');

      cards.push({
        title,
        frontText,
        backText: backPart,
      });
    }

    return cards;
  }
}
