import { In, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { StatBlock } from '../entities/StatBlock';
import { CreateStatBlockDto, StatBlockFilter } from '../types/statblock.types';
import { StatBlockImage } from '../entities/StatBlockImage';

export class StatBlockService {
  private statblockRepository: Repository<StatBlock>;
  private imageRepository: Repository<StatBlockImage>;

  constructor() {
    this.statblockRepository = AppDataSource.getRepository(StatBlock);
    this.imageRepository = AppDataSource.getRepository(StatBlockImage);
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
  // Remove dependent image first to satisfy FK constraint
  await this.imageRepository.delete({ statblockId: id });
  const result = await this.statblockRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async deleteMultipleStatBlocks(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  // Remove dependent images first
  await this.imageRepository.delete({ statblockId: In(ids) });
  await this.statblockRepository.delete(ids);
  }

  async getTags(): Promise<string[]> {
    const statblocks = await this.statblockRepository.find();
    const tagSet = new Set<string>();
    statblocks.forEach(sb => sb.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }

  async setImage(id: string, data: Buffer, mime: string, filename?: string): Promise<void> {
    const statblock = await this.statblockRepository.findOne({ where: { id } });
    if (!statblock) throw new Error('StatBlock not found');
    let image = await this.imageRepository.findOne({ where: { statblockId: id } });
    if (!image) {
      image = this.imageRepository.create({ statblockId: id, data, mime, filename: filename || null, offset: 0, scale: 1.0 });
    } else {
      image.data = data;
      image.mime = mime;
      image.filename = filename || null;
    }
    await this.imageRepository.save(image);
    statblock.hasImage = true;
    await this.statblockRepository.save(statblock);
  }

  async getImage(id: string): Promise<{ data: Buffer; mime?: string | null; filename?: string | null } | null> {
    const image = await this.imageRepository.findOne({ where: { statblockId: id } });
    if (!image) return null;
    return { data: image.data, mime: image.mime, filename: image.filename };
  }

  async getImageSettings(id: string): Promise<{ offset: number; scale: number } | null> {
    const image = await this.imageRepository.findOne({ where: { statblockId: id } });
    if (!image) return null;
    return { offset: image.offset ?? 0, scale: image.scale ?? 1.0 };
  }

  async updateImageSettings(id: string, settings: { offset?: number; scale?: number }): Promise<{ offset: number; scale: number } | null> {
    const image = await this.imageRepository.findOne({ where: { statblockId: id } });
    if (!image) return null;
    if (typeof settings.offset === 'number' && Number.isFinite(settings.offset)) {
      image.offset = Math.max(0, Math.floor(settings.offset));
    }
    if (typeof settings.scale === 'number' && Number.isFinite(settings.scale)) {
      image.scale = Math.max(0.1, Math.min(4.0, settings.scale));
    }
    const saved = await this.imageRepository.save(image);
    return { offset: saved.offset, scale: saved.scale };
  }

  async clearImage(id: string): Promise<void> {
    const statblock = await this.statblockRepository.findOne({ where: { id } });
    if (!statblock) throw new Error('StatBlock not found');
    await this.imageRepository.delete({ statblockId: id });
    statblock.hasImage = false;
    await this.statblockRepository.save(statblock);
  }
}
