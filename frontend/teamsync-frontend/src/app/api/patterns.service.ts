import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Pattern } from '../shared/models/pattern.model';

@Injectable({ providedIn: 'root' })
export class PatternsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getAll(): Observable<Pattern[]> {
    return this.http.get<Pattern[]>(`${this.base}/patterns`);
  }
}
