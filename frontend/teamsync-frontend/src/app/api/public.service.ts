import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PublicStatsResponse {
  activeTeams: number;
  uptime: number;
  userRating: number;
}

@Injectable({ providedIn: 'root' })
export class PublicService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getStats(): Observable<PublicStatsResponse> {
    return this.http.get<PublicStatsResponse>(`${this.base}/public/stats`);
  }
}
