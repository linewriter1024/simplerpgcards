import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Card, CreateCardDto, CardFilter, PdfGenerationOptions } from '../models/card.model';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private readonly baseUrl = 'http://localhost:3000/api';

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

  importCards(file: File): Observable<{ message: string; cards: Card[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ message: string; cards: Card[] }>(`${this.baseUrl}/cards/import`, formData);
  }
}
