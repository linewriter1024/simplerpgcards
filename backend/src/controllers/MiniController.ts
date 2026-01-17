import { Request, Response } from "express";
import { MiniService } from "../services/MiniService";
import { MiniPdfService } from "../services/MiniPdfService";
import {
  CreateMiniDto,
  UpdateMiniDto,
  CreateMiniSheetDto,
  UpdateMiniSheetDto,
} from "../types/mini.types";

export class MiniController {
  private miniService: MiniService;
  private miniPdfService: MiniPdfService;

  constructor() {
    this.miniService = new MiniService();
    this.miniPdfService = new MiniPdfService();
  }

  // ===== MINI ENDPOINTS =====

  async getAllMinis(req: Request, res: Response): Promise<void> {
    try {
      const search = (req.query.search as string) || undefined;
      const minis = await this.miniService.getAllMinis(
        search ? { search } : undefined,
      );
      // Remove binary data from list response
      const sanitized = minis.map((m) => ({
        id: m.id,
        name: m.name,
        tags: m.tags,
        hasBackImage: !!m.backImageData,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      }));
      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching minis:", error);
      res.status(500).json({ error: "Failed to fetch minis" });
    }
  }

  async getMiniById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const mini = await this.miniService.getMiniById(id);

      if (!mini) {
        res.status(404).json({ error: "Mini not found" });
        return;
      }

      res.json({
        id: mini.id,
        name: mini.name,
        tags: mini.tags,
        hasBackImage: !!mini.backImageData,
        createdAt: mini.createdAt,
        updatedAt: mini.updatedAt,
      });
    } catch (error) {
      console.error("Error fetching mini:", error);
      res.status(500).json({ error: "Failed to fetch mini" });
    }
  }

  async createMini(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Image file is required" });
        return;
      }

      const data: CreateMiniDto = {
        name: req.body.name || "Unnamed Mini",
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      };

      const newMini = await this.miniService.createMini(
        data,
        req.file.buffer,
        req.file.mimetype,
      );

      res.status(201).json({
        id: newMini.id,
        name: newMini.name,
        tags: newMini.tags,
        hasBackImage: false,
        createdAt: newMini.createdAt,
        updatedAt: newMini.updatedAt,
      });
    } catch (error) {
      console.error("Error creating mini:", error);
      res.status(500).json({ error: "Failed to create mini" });
    }
  }

  async createMiniFromBase64(req: Request, res: Response): Promise<void> {
    try {
      const { name, tags, imageData, imageMime } = req.body;

      if (!imageData) {
        res.status(400).json({ error: "Image data is required" });
        return;
      }

      // Handle base64 data URL or raw base64
      let base64Data = imageData;
      let mime = imageMime || "image/png";

      if (imageData.startsWith("data:")) {
        const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mime = matches[1];
          base64Data = matches[2];
        }
      }

      const buffer = Buffer.from(base64Data, "base64");

      const data: CreateMiniDto = {
        name: name || "Unnamed Mini",
        tags: tags || [],
      };

      const newMini = await this.miniService.createMini(data, buffer, mime);

      res.status(201).json({
        id: newMini.id,
        name: newMini.name,
        tags: newMini.tags,
        hasBackImage: false,
        createdAt: newMini.createdAt,
        updatedAt: newMini.updatedAt,
      });
    } catch (error) {
      console.error("Error creating mini from base64:", error);
      res.status(500).json({ error: "Failed to create mini" });
    }
  }

  async updateMini(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateMiniDto = req.body;

      const updatedMini = await this.miniService.updateMini(id, updates);

      if (!updatedMini) {
        res.status(404).json({ error: "Mini not found" });
        return;
      }

      res.json({
        id: updatedMini.id,
        name: updatedMini.name,
        tags: updatedMini.tags,
        hasBackImage: !!updatedMini.backImageData,
        createdAt: updatedMini.createdAt,
        updatedAt: updatedMini.updatedAt,
      });
    } catch (error) {
      console.error("Error updating mini:", error);
      res.status(500).json({ error: "Failed to update mini" });
    }
  }

  async deleteMini(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await this.miniService.deleteMini(id);

      if (!success) {
        res.status(404).json({ error: "Mini not found" });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting mini:", error);
      res.status(500).json({ error: "Failed to delete mini" });
    }
  }

  async deleteMultipleMinis(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: "Invalid or empty ids array" });
        return;
      }

      await this.miniService.deleteMultipleMinis(ids);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting minis:", error);
      res.status(500).json({ error: "Failed to delete minis" });
    }
  }

  // ===== IMAGE ENDPOINTS =====

  async getFrontImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const image = await this.miniService.getFrontImage(id);

      if (!image) {
        res.status(404).json({ error: "Image not found" });
        return;
      }

      res.set("Content-Type", image.mime || "image/png");
      res.send(image.data);
    } catch (error) {
      console.error("Error fetching front image:", error);
      res.status(500).json({ error: "Failed to fetch image" });
    }
  }

  async getBackImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const image = await this.miniService.getBackImage(id);

      if (!image) {
        res.status(404).json({ error: "Back image not found" });
        return;
      }

      res.set("Content-Type", image.mime || "image/png");
      res.send(image.data);
    } catch (error) {
      console.error("Error fetching back image:", error);
      res.status(500).json({ error: "Failed to fetch back image" });
    }
  }

  async uploadFrontImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.file) {
        res.status(400).json({ error: "Image file is required" });
        return;
      }

      await this.miniService.setFrontImage(
        id,
        req.file.buffer,
        req.file.mimetype,
      );
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error uploading front image:", error);
      if (error.message === "Mini not found") {
        res.status(404).json({ error: "Mini not found" });
      } else {
        res.status(500).json({ error: "Failed to upload image" });
      }
    }
  }

  async setFrontImageFromBase64(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { data } = req.body;

      if (!data) {
        res.status(400).json({ error: "Image data is required" });
        return;
      }

      let base64Data = data;
      let mime = "image/png";

      if (data.startsWith("data:")) {
        const matches = data.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mime = matches[1];
          base64Data = matches[2];
        }
      }

      const buffer = Buffer.from(base64Data, "base64");
      await this.miniService.setFrontImage(id, buffer, mime);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error setting front image from base64:", error);
      if (error.message === "Mini not found") {
        res.status(404).json({ error: "Mini not found" });
      } else {
        res.status(500).json({ error: "Failed to set image" });
      }
    }
  }

  async uploadBackImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.file) {
        res.status(400).json({ error: "Image file is required" });
        return;
      }

      await this.miniService.setBackImage(
        id,
        req.file.buffer,
        req.file.mimetype,
      );
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error uploading back image:", error);
      if (error.message === "Mini not found") {
        res.status(404).json({ error: "Mini not found" });
      } else {
        res.status(500).json({ error: "Failed to upload back image" });
      }
    }
  }

  async setBackImageFromBase64(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { data } = req.body;

      if (!data) {
        res.status(400).json({ error: "Image data is required" });
        return;
      }

      let base64Data = data;
      let mime = "image/png";

      if (data.startsWith("data:")) {
        const matches = data.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mime = matches[1];
          base64Data = matches[2];
        }
      }

      const buffer = Buffer.from(base64Data, "base64");
      await this.miniService.setBackImage(id, buffer, mime);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error setting back image from base64:", error);
      if (error.message === "Mini not found") {
        res.status(404).json({ error: "Mini not found" });
      } else {
        res.status(500).json({ error: "Failed to set back image" });
      }
    }
  }

  async deleteBackImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await this.miniService.deleteBackImage(id);

      if (!success) {
        res.status(404).json({ error: "Mini not found" });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting back image:", error);
      res.status(500).json({ error: "Failed to delete back image" });
    }
  }

  async swapImages(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await this.miniService.swapImages(id);

      if (!success) {
        res
          .status(404)
          .json({ error: "Mini not found or no back image to swap" });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error swapping images:", error);
      res.status(500).json({ error: "Failed to swap images" });
    }
  }

  async getTags(req: Request, res: Response): Promise<void> {
    try {
      const tags = await this.miniService.getTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ error: "Failed to fetch tags" });
    }
  }

  // ===== SHEET ENDPOINTS =====

  async getAllSheets(req: Request, res: Response): Promise<void> {
    try {
      const sheets = await this.miniService.getAllSheets();
      res.json(sheets);
    } catch (error) {
      console.error("Error fetching sheets:", error);
      res.status(500).json({ error: "Failed to fetch sheets" });
    }
  }

  async getSheetById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const sheet = await this.miniService.getSheetById(id);

      if (!sheet) {
        res.status(404).json({ error: "Sheet not found" });
        return;
      }

      res.json(sheet);
    } catch (error) {
      console.error("Error fetching sheet:", error);
      res.status(500).json({ error: "Failed to fetch sheet" });
    }
  }

  async createSheet(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateMiniSheetDto = req.body;
      const newSheet = await this.miniService.createSheet(data);
      res.status(201).json(newSheet);
    } catch (error) {
      console.error("Error creating sheet:", error);
      res.status(500).json({ error: "Failed to create sheet" });
    }
  }

  async updateSheet(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateMiniSheetDto = req.body;

      const updatedSheet = await this.miniService.updateSheet(id, updates);

      if (!updatedSheet) {
        res.status(404).json({ error: "Sheet not found" });
        return;
      }

      res.json(updatedSheet);
    } catch (error) {
      console.error("Error updating sheet:", error);
      res.status(500).json({ error: "Failed to update sheet" });
    }
  }

  async deleteSheet(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await this.miniService.deleteSheet(id);

      if (!success) {
        res.status(404).json({ error: "Sheet not found" });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting sheet:", error);
      res.status(500).json({ error: "Failed to delete sheet" });
    }
  }

  // ===== PDF GENERATION =====

  async generateSheetPdf(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const sheet = await this.miniService.getSheetById(id);

      if (!sheet) {
        res.status(404).json({ error: "Sheet not found" });
        return;
      }

      // Get all minis referenced in the sheet
      const minis = await this.miniService.getMinisForSheet(id);

      const pdfBuffer = await this.miniPdfService.generateSheetPdf({
        placements: sheet.placements,
        settings: sheet.settings,
        minis,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${sheet.name || "mini-sheet"}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating sheet PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  }

  async generateSheetPdfFromData(req: Request, res: Response): Promise<void> {
    try {
      const { placements, settings, miniIds } = req.body;

      if (!placements || !settings) {
        res.status(400).json({ error: "Placements and settings are required" });
        return;
      }

      // Get all minis needed
      const minis = new Map();
      if (miniIds && miniIds.length > 0) {
        for (const id of miniIds) {
          const mini = await this.miniService.getMiniById(id);
          if (mini) {
            minis.set(id, mini);
          }
        }
      }

      const pdfBuffer = await this.miniPdfService.generateSheetPdf({
        placements,
        settings,
        minis,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'inline; filename="mini-sheet.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating sheet PDF from data:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  }
}
