import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notification } from '../shared/models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getAll(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.base}/notifications`);
  }

  markRead(id: string): Observable<Notification> {
    return this.http.put<Notification>(`${this.base}/notifications/${id}/read`, {});
  }
}
