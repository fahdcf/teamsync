import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AiRequest {
  context: string;
  question?: string;
  payload?: Record<string, unknown>;
}

export interface AiResponse {
  answer: string;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  ask(request: AiRequest): Observable<AiResponse> {
    return this.http.post<AiResponse>(`${this.base}/ai/chat`, request);
  }

  insights(request: AiRequest): Observable<AiResponse> {
    return this.http.post<AiResponse>(`${this.base}/ai/insights`, request);
  }
}
