import { Request, Response } from 'express';
import { StatBlockService } from '../services/StatBlockService';
import { CreateStatBlockDto } from '../types/statblock.types';

export class StatBlockController {
  private statblockService: StatBlockService;

  constructor() {
    this.statblockService = new StatBlockService();
  }

  async getAllStatBlocks(req: Request, res: Response): Promise<void> {
    try {
      const search = (req.query.search as string) || undefined;
      const statblocks = await this.statblockService.getAllStatBlocks(search ? { search } : undefined);
      res.json(statblocks);
    } catch (error) {
      console.error('Error fetching statblocks:', error);
      res.status(500).json({ error: 'Failed to fetch statblocks' });
    }
  }

  async getStatBlockById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const statblock = await this.statblockService.getStatBlockById(id);
      
      if (!statblock) {
        res.status(404).json({ error: 'StatBlock not found' });
        return;
      }

      res.json(statblock);
    } catch (error) {
      console.error('Error fetching statblock:', error);
      res.status(500).json({ error: 'Failed to fetch statblock' });
    }
  }

  async createStatBlock(req: Request, res: Response): Promise<void> {
    try {
      const statblockData: CreateStatBlockDto = req.body;
      const newStatblock = await this.statblockService.createStatBlock(statblockData);
      res.status(201).json(newStatblock);
    } catch (error) {
      console.error('Error creating statblock:', error);
      res.status(500).json({ error: 'Failed to create statblock' });
    }
  }

  async updateStatBlock(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: Partial<CreateStatBlockDto> = req.body;
      
      const updatedStatblock = await this.statblockService.updateStatBlock(id, updates);
      
      if (!updatedStatblock) {
        res.status(404).json({ error: 'StatBlock not found' });
        return;
      }

      res.json(updatedStatblock);
    } catch (error) {
      console.error('Error updating statblock:', error);
      res.status(500).json({ error: 'Failed to update statblock' });
    }
  }

  async deleteStatBlock(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await this.statblockService.deleteStatBlock(id);
      
      if (!success) {
        res.status(404).json({ error: 'StatBlock not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting statblock:', error);
      res.status(500).json({ error: 'Failed to delete statblock' });
    }
  }

  async deleteMultipleStatBlocks(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: 'Invalid or empty ids array' });
        return;
      }

      await this.statblockService.deleteMultipleStatBlocks(ids);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting statblocks:', error);
      res.status(500).json({ error: 'Failed to delete statblocks' });
    }
  }
}
