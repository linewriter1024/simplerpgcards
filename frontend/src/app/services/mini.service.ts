import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import {
  Mini,
  MiniFilter,
  MiniSheet,
  MiniPlacement,
  SheetSettings,
  CreateMiniSheetDto,
  UpdateMiniSheetDto,
  UpdateMiniDto,
} from "../models/mini.model";

@Injectable({
  providedIn: "root",
})
export class MiniService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ===== MINI OPERATIONS =====

  getMinis(filter?: MiniFilter): Observable<Mini[]> {
    let params: any = {};
    if (filter) {
      if (filter.search) params.search = filter.search;
      if (filter.tags && filter.tags.length > 0)
        params.tags = filter.tags.join(",");
    }
    return this.http.get<Mini[]>(`${this.apiUrl}/minis`, { params });
  }

  getMini(id: string): Observable<Mini> {
    return this.http.get<Mini>(`${this.apiUrl}/minis/${id}`);
  }

  createMini(
    name: string,
    imageData: string,
    tags?: string[],
  ): Observable<Mini> {
    return this.http.post<Mini>(`${this.apiUrl}/minis/base64`, {
      name,
      imageData,
      tags: tags || [],
    });
  }

  createMiniWithFile(
    file: File,
    name: string,
    tags?: string[],
  ): Observable<Mini> {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("name", name);
    if (tags && tags.length > 0) {
      formData.append("tags", JSON.stringify(tags));
    }
    return this.http.post<Mini>(`${this.apiUrl}/minis`, formData);
  }

  updateMini(id: string, updates: UpdateMiniDto): Observable<Mini> {
    return this.http.put<Mini>(`${this.apiUrl}/minis/${id}`, updates);
  }

  deleteMini(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/minis/${id}`);
  }

  deleteMinis(ids: string[]): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/minis/bulk`, {
      body: { ids },
    });
  }

  getTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/minis/tags`);
  }

  // ===== IMAGE OPERATIONS =====

  getFrontImageUrl(id: string): string {
    return `${this.apiUrl}/minis/${id}/image`;
  }

  getBackImageUrl(id: string): string {
    return `${this.apiUrl}/minis/${id}/back-image`;
  }

  uploadFrontImage(id: string, file: File): Observable<void> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post<void>(`${this.apiUrl}/minis/${id}/image`, formData);
  }

  setFrontImageFromBase64(id: string, data: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/minis/${id}/image/base64`, {
      data,
    });
  }

  uploadBackImage(id: string, file: File): Observable<void> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post<void>(
      `${this.apiUrl}/minis/${id}/back-image`,
      formData,
    );
  }

  setBackImageFromBase64(id: string, data: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/minis/${id}/back-image/base64`,
      { data },
    );
  }

  deleteBackImage(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/minis/${id}/back-image`);
  }

  swapImages(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/minis/${id}/swap-images`, {});
  }

  // ===== SHEET OPERATIONS =====

  getSheets(): Observable<MiniSheet[]> {
    return this.http.get<MiniSheet[]>(`${this.apiUrl}/mini-sheets`);
  }

  getSheet(id: string): Observable<MiniSheet> {
    return this.http.get<MiniSheet>(`${this.apiUrl}/mini-sheets/${id}`);
  }

  createSheet(data: CreateMiniSheetDto): Observable<MiniSheet> {
    return this.http.post<MiniSheet>(`${this.apiUrl}/mini-sheets`, data);
  }

  updateSheet(id: string, updates: UpdateMiniSheetDto): Observable<MiniSheet> {
    return this.http.put<MiniSheet>(
      `${this.apiUrl}/mini-sheets/${id}`,
      updates,
    );
  }

  deleteSheet(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/mini-sheets/${id}`);
  }

  // ===== PDF OPERATIONS =====

  getSheetPdfUrl(id: string): string {
    return `${this.apiUrl}/mini-sheets/${id}/pdf`;
  }

  generatePreviewPdf(
    placements: MiniPlacement[],
    settings: SheetSettings,
  ): Observable<Blob> {
    const miniIds = [...new Set(placements.map((p) => p.miniId))];
    return this.http.post(
      `${this.apiUrl}/mini-sheets/pdf`,
      {
        placements,
        settings,
        miniIds,
      },
      { responseType: "blob" },
    );
  }
}
