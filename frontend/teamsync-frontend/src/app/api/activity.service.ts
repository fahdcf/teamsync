import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ActivityLog } from '../shared/models/activity.model';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getMyActivity(): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(`${this.base}/users/me/activity`);
  }
}
