export interface Mini {
  id: string;
  name: string;
  tags?: string[];
  hasBackImage: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateMiniDto {
  name: string;
  tags?: string[];
  imageData: string; // base64
  imageMime?: string;
}

export interface UpdateMiniDto {
  name?: string;
  tags?: string[];
}

export interface MiniFilter {
  search?: string;
  tags?: string[];
}

export interface MiniPlacement {
  id: string;
  miniId: string;
  x: number; // position in inches from left
  y: number; // position in inches from top
  width: number; // width in inches (default 0.75)
  height: number; // height in inches (default 0.75)
  text?: string;
  textPosition?: "top" | "bottom" | "center";
  textSize?: number; // font size in points (default 8)
  rotation?: number;
  backMode?: "none" | "back-image"; // how to handle the back side
}

export interface SheetSettings {
  pageWidth: number; // in inches (8.5 for US Letter)
  pageHeight: number; // in inches (11 for US Letter)
  marginTop: number; // in inches
  marginBottom: number; // in inches
  marginLeft: number; // in inches
  marginRight: number; // in inches
  gridSnap: number; // in inches
  showGrid: boolean;
}

export interface MiniSheet {
  id?: string;
  name: string;
  code?: string; // Short code for labels like "TF"
  placements: MiniPlacement[];
  settings: SheetSettings;
  createdAt?: Date;
  updatedAt?: Date;
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

export const DEFAULT_SHEET_SETTINGS: SheetSettings = {
  pageWidth: 8.5, // US Letter width in inches
  pageHeight: 11, // US Letter height in inches
  marginTop: 0.5,
  marginBottom: 0.5,
  marginLeft: 0.5,
  marginRight: 0.5,
  gridSnap: 0.25,
  showGrid: true,
};

export const DEFAULT_MINI_WIDTH = 0.75; // inches
export const DEFAULT_MINI_HEIGHT = 0.75; // inches

// Common mini sizes in inches
export const MINI_SIZES = [
  { label: '0.5"', value: 0.5 },
  { label: '0.75" (default)', value: 0.75 },
  { label: '1"', value: 1 },
  { label: '1.5"', value: 1.5 },
  { label: '2"', value: 2 },
];

// US Letter paper only
export const PAPER_SIZE = { label: "US Letter", width: 8.5, height: 11 };
