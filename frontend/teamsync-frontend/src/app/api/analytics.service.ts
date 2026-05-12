import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProjectStats, TeamWorkload, ProjectHealth } from '../shared/models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getStats(projectId: string): Observable<ProjectStats> {
    return this.http.get<ProjectStats>(`${this.base}/analytics/projects/${projectId}/stats`);
  }

  getTeamWorkload(projectId: string): Observable<TeamWorkload[]> {
    return this.http.get<TeamWorkload[]>(`${this.base}/analytics/projects/${projectId}/team-workload`);
  }

  getHealth(projectId: string): Observable<ProjectHealth> {
    return this.http.get<ProjectHealth>(`${this.base}/analytics/projects/${projectId}/health`);
  }
}
