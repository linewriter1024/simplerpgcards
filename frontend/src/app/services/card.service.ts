import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Card, CreateCardDto, CardFilter, PdfGenerationOptions } from '../models/card.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllCards(filter?: CardFilter): Observable<Card[]> {
    let params = new HttpParams();
    if (filter?.tags && filter.tags.length > 0) {
      params = params.set('tags', filter.tags.join(','));
    }
    if (filter?.search) params = params.set('search', filter.search);

    return this.http.get<Card[]>(`${this.baseUrl}/cards`, { params });
  }

  getCardById(id: string): Observable<Card> {
    return this.http.get<Card>(`${this.baseUrl}/cards/${id}`);
  }

  createCard(card: CreateCardDto): Observable<Card> {
    return this.http.post<Card>(`${this.baseUrl}/cards`, card);
  }

  updateCard(id: string, card: Partial<CreateCardDto>): Observable<Card> {
    return this.http.put<Card>(`${this.baseUrl}/cards/${id}`, card);
  }

  deleteCard(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/cards/${id}`);
  }

  getTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/cards/tags`);
  }

  generatePdf(options: PdfGenerationOptions): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/cards/pdf`, options, {
      responseType: 'blob'
    });
  }

  generatePreviewPdf(cardData: CreateCardDto): Observable<Blob> {
    // Create a temporary card for preview
    const previewOptions = {
      cardIds: ['preview'], // Special ID for preview
      duplex: 'long' as const,
      marginMm: 4.0,
      previewCard: cardData // Pass the card data for preview
    };
    
    return this.http.post(`${this.baseUrl}/cards/pdf/preview`, previewOptions, {
      responseType: 'blob'
    });
  }
}
