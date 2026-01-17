import { Repository, In } from "typeorm";
import { AppDataSource } from "../config/database";
import { Mini } from "../entities/Mini";
import { MiniSheet } from "../entities/MiniSheet";
import {
  CreateMiniDto,
  UpdateMiniDto,
  CreateMiniSheetDto,
  UpdateMiniSheetDto,
  MiniFilter,
  DEFAULT_SHEET_SETTINGS,
} from "../types/mini.types";

export class MiniService {
  private miniRepository: Repository<Mini>;
  private sheetRepository: Repository<MiniSheet>;

  constructor() {
    this.miniRepository = AppDataSource.getRepository(Mini);
    this.sheetRepository = AppDataSource.getRepository(MiniSheet);
  }

  // ===== MINI CRUD =====

  async getAllMinis(filter?: MiniFilter): Promise<Mini[]> {
    const query = this.miniRepository.createQueryBuilder("mini");

    if (filter?.search) {
      query.where("LOWER(mini.name) LIKE LOWER(:search)", {
        search: `%${filter.search}%`,
      });
    }

    return await query.orderBy("mini.createdAt", "DESC").getMany();
  }

  async getMiniById(id: string): Promise<Mini | null> {
    return await this.miniRepository.findOne({ where: { id } });
  }

  async createMini(
    data: CreateMiniDto,
    imageData: Buffer,
    imageMime: string,
  ): Promise<Mini> {
    const uniqueTags = data.tags ? Array.from(new Set(data.tags)) : [];
    const mini = this.miniRepository.create({
      name: data.name,
      imageData,
      imageMime,
      tags: uniqueTags,
    });
    return await this.miniRepository.save(mini);
  }

  async updateMini(id: string, updates: UpdateMiniDto): Promise<Mini | null> {
    const mini = await this.miniRepository.findOne({ where: { id } });
    if (!mini) return null;

    if (updates.tags) {
      updates.tags = Array.from(new Set(updates.tags));
    }

    Object.assign(mini, updates);
    return await this.miniRepository.save(mini);
  }

  async deleteMini(id: string): Promise<boolean> {
    const result = await this.miniRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async deleteMultipleMinis(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    await this.miniRepository.delete({ id: In(ids) });
  }

  // ===== MINI IMAGE MANAGEMENT =====

  async setFrontImage(id: string, data: Buffer, mime: string): Promise<void> {
    const mini = await this.miniRepository.findOne({ where: { id } });
    if (!mini) throw new Error("Mini not found");
    mini.imageData = data;
    mini.imageMime = mime;
    await this.miniRepository.save(mini);
  }

  async setBackImage(id: string, data: Buffer, mime: string): Promise<void> {
    const mini = await this.miniRepository.findOne({ where: { id } });
    if (!mini) throw new Error("Mini not found");
    mini.backImageData = data;
    mini.backImageMime = mime;
    await this.miniRepository.save(mini);
  }

  async getFrontImage(
    id: string,
  ): Promise<{ data: Buffer; mime?: string | null } | null> {
    const mini = await this.miniRepository.findOne({ where: { id } });
    if (!mini || !mini.imageData) return null;
    return { data: mini.imageData, mime: mini.imageMime };
  }

  async getBackImage(
    id: string,
  ): Promise<{ data: Buffer; mime?: string | null } | null> {
    const mini = await this.miniRepository.findOne({ where: { id } });
    if (!mini || !mini.backImageData) return null;
    return { data: mini.backImageData, mime: mini.backImageMime };
  }

  async deleteBackImage(id: string): Promise<boolean> {
    const mini = await this.miniRepository.findOne({ where: { id } });
    if (!mini) return false;
    mini.backImageData = null;
    mini.backImageMime = null;
    await this.miniRepository.save(mini);
    return true;
  }

  async swapImages(id: string): Promise<boolean> {
    const mini = await this.miniRepository.findOne({ where: { id } });
    if (!mini || !mini.backImageData) return false;

    // Swap front and back
    const tempData = mini.imageData;
    const tempMime = mini.imageMime;

    mini.imageData = mini.backImageData;
    mini.imageMime = mini.backImageMime;
    mini.backImageData = tempData;
    mini.backImageMime = tempMime;

    await this.miniRepository.save(mini);
    return true;
  }

  async getTags(): Promise<string[]> {
    const minis = await this.miniRepository.find();
    const tagSet = new Set<string>();
    minis.forEach((m) => m.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }

  // ===== MINI SHEET CRUD =====

  async getAllSheets(): Promise<MiniSheet[]> {
    return await this.sheetRepository.find({ order: { createdAt: "DESC" } });
  }

  async getSheetById(id: string): Promise<MiniSheet | null> {
    return await this.sheetRepository.findOne({ where: { id } });
  }

  async createSheet(data: CreateMiniSheetDto): Promise<MiniSheet> {
    const sheet = this.sheetRepository.create({
      name: data.name,
      placements: data.placements || [],
      settings: { ...DEFAULT_SHEET_SETTINGS, ...data.settings },
    });
    return await this.sheetRepository.save(sheet);
  }

  async updateSheet(
    id: string,
    updates: UpdateMiniSheetDto,
  ): Promise<MiniSheet | null> {
    const sheet = await this.sheetRepository.findOne({ where: { id } });
    if (!sheet) return null;

    if (updates.name !== undefined) {
      sheet.name = updates.name;
    }
    if (updates.placements !== undefined) {
      sheet.placements = updates.placements;
    }
    if (updates.settings !== undefined) {
      sheet.settings = { ...sheet.settings, ...updates.settings };
    }

    return await this.sheetRepository.save(sheet);
  }

  async deleteSheet(id: string): Promise<boolean> {
    const result = await this.sheetRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // ===== UTILITY =====

  async getMinisForSheet(sheetId: string): Promise<Map<string, Mini>> {
    const sheet = await this.sheetRepository.findOne({
      where: { id: sheetId },
    });
    if (!sheet) return new Map();

    const miniIds = [...new Set(sheet.placements.map((p) => p.miniId))];
    if (miniIds.length === 0) return new Map();

    const minis = await this.miniRepository.find({
      where: { id: In(miniIds) },
    });
    return new Map(minis.map((m) => [m.id, m]));
  }
}
