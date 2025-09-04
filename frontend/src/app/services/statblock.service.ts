import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { StatBlock, CreateStatBlockDto, StatBlockFilter } from '../models/statblock.model';

@Injectable({
  providedIn: 'root'
})
export class StatblockService {
  private apiUrl = environment.apiUrl + '/statblocks';

  constructor(private http: HttpClient) {}

  getStatblocks(filter?: StatBlockFilter): Observable<StatBlock[]> {
    let params: any = {};
    if (filter) {
      if (filter.search) params.search = filter.search;
      if (filter.tags && filter.tags.length > 0) params.tags = filter.tags.join(',');
      if (filter.crRange) {
        if (filter.crRange.min !== undefined) params.crMin = filter.crRange.min.toString();
        if (filter.crRange.max !== undefined) params.crMax = filter.crRange.max.toString();
      }
    }
    return this.http.get<StatBlock[]>(this.apiUrl, { params });
  }

  getStatblock(id: string): Observable<StatBlock> {
    return this.http.get<StatBlock>(`${this.apiUrl}/${id}`);
  }

  createStatblock(statblock: CreateStatBlockDto): Observable<StatBlock> {
    return this.http.post<StatBlock>(this.apiUrl, statblock);
  }

  updateStatblock(id: string, statblock: Partial<CreateStatBlockDto>): Observable<StatBlock> {
    return this.http.put<StatBlock>(`${this.apiUrl}/${id}`, statblock);
  }

  deleteStatblock(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deleteStatblocks(ids: string[]): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bulk`, { body: { ids } });
  }
}
