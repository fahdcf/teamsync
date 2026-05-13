import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TaskPriority } from '../shared/models/task.model';

export interface CalendarEvent {
  id: string;
  type: 'TASK' | 'PROJECT';
  title: string;
  date: string;
  priority: TaskPriority;
  projectId: string;
  projectTitle: string;
}

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getEvents(from: string, to: string, workspaceId?: string): Observable<CalendarEvent[]> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (workspaceId) params = params.set('workspaceId', workspaceId);
    return this.http.get<CalendarEvent[]>(`${this.base}/calendar/events`, { params });
  }
}
