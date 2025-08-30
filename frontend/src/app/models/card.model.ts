export interface Card {
  id?: string;
  title: string;
  frontText?: string;
  backText?: string;
  category?: string;
  level?: string;
  range?: string;
  duration?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCardDto {
  title: string;
  frontText?: string;
  backText?: string;
  category?: string;
  level?: string;
  range?: string;
  duration?: string;
  notes?: string;
}

export interface CardFilter {
  category?: string;
  level?: string;
  search?: string;
}

export interface PdfGenerationOptions {
  cardIds: string[];
  duplex: 'long' | 'short';
  titleSize: number;
  bodySize: number;
  marginMm: number;
}
