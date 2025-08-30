export interface CreateCardDto {
  title: string;
  frontText?: string;
  backText?: string;
  tags?: string[];
}

export interface UpdateCardDto extends Partial<CreateCardDto> {}

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
