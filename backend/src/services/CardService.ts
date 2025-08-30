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

    if (filter?.category) {
      queryBuilder.andWhere('card.category = :category', { category: filter.category });
    }

    if (filter?.level) {
      queryBuilder.andWhere('card.level = :level', { level: filter.level });
    }

    if (filter?.search) {
      queryBuilder.andWhere(
        '(card.title LIKE :search OR card.frontText LIKE :search OR card.backText LIKE :search)',
        { search: `%${filter.search}%` }
      );
    }

    return queryBuilder.orderBy('card.title', 'ASC').getMany();
  }

  async getCardById(id: string): Promise<Card | null> {
    return this.cardRepository.findOne({ where: { id } });
  }

  async createCard(cardData: CreateCardDto): Promise<Card> {
    const card = this.cardRepository.create(cardData);
    return this.cardRepository.save(card);
  }

  async updateCard(id: string, cardData: UpdateCardDto): Promise<Card | null> {
    await this.cardRepository.update(id, cardData);
    return this.getCardById(id);
  }

  async deleteCard(id: string): Promise<boolean> {
    const result = await this.cardRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async getCardsByIds(ids: string[]): Promise<Card[]> {
    return this.cardRepository.findByIds(ids);
  }

  async getCategories(): Promise<string[]> {
    const result = await this.cardRepository
      .createQueryBuilder('card')
      .select('DISTINCT card.category', 'category')
      .where('card.category IS NOT NULL')
      .getRawMany();
    
    return result.map(r => r.category).filter(Boolean);
  }

  async getLevels(): Promise<string[]> {
    const result = await this.cardRepository
      .createQueryBuilder('card')
      .select('DISTINCT card.level', 'level')
      .where('card.level IS NOT NULL')
      .getRawMany();
    
    return result.map(r => r.level).filter(Boolean);
  }
}
