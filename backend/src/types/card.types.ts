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

export interface UpdateCardDto extends Partial<CreateCardDto> {}

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
