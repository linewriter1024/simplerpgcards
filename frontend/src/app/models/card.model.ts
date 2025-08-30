export interface Card {
  id?: string;
  title: string;
  frontText?: string;
  backText?: string;
  tags?: string[]; // Array of tag strings
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCardDto {
  title: string;
  frontText?: string;
  backText?: string;
  tags?: string[];
}

export interface CardFilter {
  tags?: string[];
  search?: string;
}

export interface PdfGenerationOptions {
  cardIds: string[];
  duplex: 'long' | 'short';
  titleSize: number;
  bodySize: number;
  marginMm: number;
}
