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
      // Remove heavy binary field if selected via custom queries; ensure hasImage flag is present
      const sanitized = statblocks.map(sb => ({
        ...sb,
        imageData: undefined,
      }));
      res.json(sanitized);
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
  // Do not include raw image bytes in JSON payload
  const { imageData, ...rest } = (statblock as any);
  res.json(rest);
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
  const { imageData, ...rest } = (updatedStatblock as any);
  res.json(rest);
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

  // Upload image via multipart/form-data file
  async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
  if (!(req as any).file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
  const { buffer, mimetype, originalname } = (req as any).file as any;
      await this.statblockService.setImage(id, buffer, mimetype, originalname);
      res.status(204).send();
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }

  // Set image from external URL
  async setImageFromUrl(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { url } = req.body as { url?: string };
      if (!url) {
        res.status(400).json({ error: 'Missing url' });
        return;
      }
      const response = await fetch(url);
      if (!response.ok) {
        res.status(400).json({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` });
        return;
      }
      const arrayBuf = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const filename = url.split('/').pop() || 'image';
      await this.statblockService.setImage(id, Buffer.from(arrayBuf), contentType, filename);
      res.status(204).send();
    } catch (error) {
      console.error('Error setting image from URL:', error);
      res.status(500).json({ error: 'Failed to set image from URL' });
    }
  }

  // Set image from base64 data URL or raw base64
  async setImageFromBase64(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { data } = req.body as { data?: string };
      if (!data) {
        res.status(400).json({ error: 'Missing data' });
        return;
      }
      let mime = 'image/png';
      let base64 = data;
      const dataUrlMatch = data.match(/^data:(.*?);base64,(.*)$/);
      if (dataUrlMatch) {
        mime = dataUrlMatch[1] || mime;
        base64 = dataUrlMatch[2];
      }
      const buffer = Buffer.from(base64, 'base64');
      await this.statblockService.setImage(id, buffer, mime, `clipboard.${mime.split('/')[1] || 'png'}`);
      res.status(204).send();
    } catch (error) {
      console.error('Error setting image from base64:', error);
      res.status(500).json({ error: 'Failed to set image from base64' });
    }
  }

  // Get image bytes
  async getImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.statblockService.getImage(id);
      if (!result) {
        res.status(404).json({ error: 'Image not found' });
        return;
      }
  // Allow embedding across origins (frontend dev server)
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Content-Type', result.mime || 'application/octet-stream');
      // Inline display with best-effort filename
      if (result.filename) {
        res.setHeader('Content-Disposition', `inline; filename="${result.filename}"`);
      }
      res.send(result.data);
    } catch (error) {
      console.error('Error fetching image:', error);
      res.status(500).json({ error: 'Failed to fetch image' });
    }
  }

  // Delete image
  async deleteImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.statblockService.clearImage(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  }

  // Get image display settings (offset/scale)
  async getImageSettings(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.statblockService.getImageSettings(id);
      if (!result) {
        res.status(404).json({ error: 'Image not found' });
        return;
      }
      res.json(result);
    } catch (error) {
      console.error('Error fetching image settings:', error);
      res.status(500).json({ error: 'Failed to fetch image settings' });
    }
  }

  // Update image display settings (offset/scale)
  async updateImageSettings(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { offset, scale } = req.body as { offset?: number; scale?: number };
      const updated = await this.statblockService.updateImageSettings(id, { offset, scale });
      if (!updated) {
        res.status(404).json({ error: 'Image not found' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating image settings:', error);
      res.status(500).json({ error: 'Failed to update image settings' });
    }
  }
}
