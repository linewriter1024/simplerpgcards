import { MiniPlacement, SheetSettings } from "../entities/MiniSheet";

export interface CreateMiniDto {
  name: string;
  tags?: string[];
}

export interface UpdateMiniDto {
  name?: string;
  tags?: string[];
}

export interface CreateMiniSheetDto {
  name: string;
  code?: string;
  placements?: MiniPlacement[];
  settings?: Partial<SheetSettings>;
}

export interface UpdateMiniSheetDto {
  name?: string;
  code?: string;
  placements?: MiniPlacement[];
  settings?: Partial<SheetSettings>;
}

export interface MiniFilter {
  search?: string;
  tags?: string[];
}

export const DEFAULT_SHEET_SETTINGS: SheetSettings = {
  pageWidth: 8.5, // US Letter width in inches
  pageHeight: 11, // US Letter height in inches
  marginTop: 0.5,
  marginBottom: 0.5,
  marginLeft: 0.5,
  marginRight: 0.5,
  gridSnap: 0.25, // 0.25 inch grid
  showGrid: true,
};

export const DEFAULT_MINI_WIDTH = 0.75; // inches
export const DEFAULT_MINI_HEIGHT = 0.75; // inches
