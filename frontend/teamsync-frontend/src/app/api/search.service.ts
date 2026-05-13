import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SearchResult } from '../shared/models/search.model';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  search(keyword: string): Observable<SearchResult[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<SearchResult[]>(`${this.base}/search`, { params });
  }
}
