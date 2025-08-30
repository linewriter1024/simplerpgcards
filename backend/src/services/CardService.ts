import { Repository } from 'typeorm';
import { Card } from '../entities/Card';
import { AppDataSource } from '../config/database';
import { CreateCardDto, UpdateCardDto, CardFilter } from '../types/card.types';

export class CardService {
  private cardRepository: Repository<Card>;

  constructor() {
    this.cardRepository = AppDataSource.getRepository(Card);
  }

  async getAllCards(filter?: CardFilter): Promise<Card[]> {
    const queryBuilder = this.cardRepository.createQueryBuilder('card');

    if (filter?.tags && filter.tags.length > 0) {
      // Check if any of the requested tags are present in the card's tags
      const tagConditions = filter.tags.map((_: string, index: number) => 
        `card.tags LIKE :tag${index}`
      ).join(' OR ');
      
      const tagParameters = filter.tags.reduce((params: any, tag: string, index: number) => {
        params[`tag${index}`] = `%"${tag}"%`;
        return params;
      }, {});
      
      queryBuilder.andWhere(`(${tagConditions})`, tagParameters);
    }

    if (filter?.search) {
      queryBuilder.andWhere(
        '(card.title LIKE :search OR card.frontText LIKE :search OR card.backText LIKE :search)',
        { search: `%${filter.search}%` }
      );
    }

    return queryBuilder.orderBy('card.createdAt', 'DESC').getMany();
  }

  async getCardById(id: string): Promise<Card | null> {
    const card = await this.cardRepository.findOne({ where: { id } });
    if (card && card.tags) {
      // Parse tags from JSON string to array
      try {
        (card as any).parsedTags = JSON.parse(card.tags);
      } catch {
        (card as any).parsedTags = [];
      }
    }
    return card;
  }

  async createCard(cardData: CreateCardDto): Promise<Card> {
    const card = this.cardRepository.create({
      title: cardData.title,
      frontText: cardData.frontText,
      backText: cardData.backText,
      tags: cardData.tags ? JSON.stringify(cardData.tags) : undefined
    });
    const savedCard = await this.cardRepository.save(card);
    
    // Add parsed tags for response
    if (savedCard.tags) {
      try {
        (savedCard as any).parsedTags = JSON.parse(savedCard.tags);
      } catch {
        (savedCard as any).parsedTags = [];
      }
    }
    
    return savedCard;
  }

  async updateCard(id: string, cardData: UpdateCardDto): Promise<Card | null> {
    const updateData: any = {
      title: cardData.title,
      frontText: cardData.frontText,
      backText: cardData.backText,
      tags: cardData.tags ? JSON.stringify(cardData.tags) : undefined
    };
    
    await this.cardRepository.update(id, updateData);
    return this.getCardById(id);
  }

  async deleteCard(id: string): Promise<boolean> {
    const result = await this.cardRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async getCardsByIds(ids: string[]): Promise<Card[]> {
    const cards = await this.cardRepository.findByIds(ids);
    
    // Parse tags for all cards
    return cards.map(card => {
      if (card.tags) {
        try {
          (card as any).parsedTags = JSON.parse(card.tags);
        } catch {
          (card as any).parsedTags = [];
        }
      }
      return card;
    });
  }

  async getAllTags(): Promise<string[]> {
    const cards = await this.cardRepository.find();
    const allTags = new Set<string>();
    
    cards.forEach(card => {
      if (card.tags) {
        try {
          const tags = JSON.parse(card.tags);
          tags.forEach((tag: string) => allTags.add(tag));
        } catch {
          // Ignore malformed tag data
        }
      }
    });
    
    return Array.from(allTags).sort();
  }
}
