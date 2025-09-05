import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { StatBlock } from '../entities/StatBlock';
import { CreateStatBlockDto, StatBlockFilter } from '../types/statblock.types';

export class StatBlockService {
  private statblockRepository: Repository<StatBlock>;

  constructor() {
    this.statblockRepository = AppDataSource.getRepository(StatBlock);
  }

  async getAllStatBlocks(filter?: StatBlockFilter): Promise<StatBlock[]> {
    const query = this.statblockRepository.createQueryBuilder('statblock');

    if (filter?.search) {
      query.where('LOWER(statblock.name) LIKE LOWER(:search)', { search: `%${filter.search}%` });
    }

    return await query.orderBy('statblock.createdAt', 'DESC').getMany();
  }

  async getStatBlockById(id: string): Promise<StatBlock | null> {
    return await this.statblockRepository.findOne({ where: { id } });
  }

  async createStatBlock(statblockData: CreateStatBlockDto): Promise<StatBlock> {
    const uniqueTags = statblockData.tags ? Array.from(new Set(statblockData.tags)) : [];
    const statblock = this.statblockRepository.create({
      ...statblockData,
      attacks: statblockData.attacks || [],
      spells: statblockData.spells || [],
      tags: uniqueTags
    });
    return await this.statblockRepository.save(statblock);
  }

  async updateStatBlock(id: string, updates: Partial<CreateStatBlockDto>): Promise<StatBlock | null> {
    const statblock = await this.statblockRepository.findOne({ where: { id } });
    if (!statblock) return null;

    if (updates.tags) {
      updates.tags = Array.from(new Set(updates.tags));
    }

    Object.assign(statblock, updates);
    return await this.statblockRepository.save(statblock);
  }

  async deleteStatBlock(id: string): Promise<boolean> {
    const result = await this.statblockRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async deleteMultipleStatBlocks(ids: string[]): Promise<void> {
    await this.statblockRepository.delete(ids);
  }

  async getTags(): Promise<string[]> {
    const statblocks = await this.statblockRepository.find();
    const tagSet = new Set<string>();
    statblocks.forEach(sb => sb.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }
}
