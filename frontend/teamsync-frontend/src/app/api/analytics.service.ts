import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AnalyticsInsight, ProjectStats, TeamPerformance, TeamWorkload, ProjectHealth } from '../shared/models/analytics.model';

export interface AnalyticsFilters {
  from?: string;
  to?: string;
  workspaceId?: string;
  projectId?: string;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getStats(projectId: string, filters: Pick<AnalyticsFilters, 'from' | 'to'> = {}): Observable<ProjectStats> {
    return this.http.get<ProjectStats>(`${this.base}/analytics/projects/${projectId}/stats`, {
      params: this.params(filters),
    });
  }

  getTeamWorkload(projectId: string): Observable<TeamWorkload[]> {
    return this.http.get<TeamWorkload[]>(`${this.base}/analytics/projects/${projectId}/team-workload`);
  }

  getHealth(projectId: string): Observable<ProjectHealth> {
    return this.http.get<ProjectHealth>(`${this.base}/analytics/projects/${projectId}/health`);
  }

  getReport(projectId: string, format = 'json'): Observable<string> {
    return this.http.get(`${this.base}/reports/projects/${projectId}`, {
      params: this.params({ format }),
      responseType: 'text',
    });
  }

  getTeamPerformance(filters: AnalyticsFilters = {}): Observable<TeamPerformance> {
    return this.http.get<TeamPerformance>(`${this.base}/analytics/team/performance`, {
      params: this.params({ ...filters }),
    });
  }

  getInsights(filters: AnalyticsFilters = {}): Observable<AnalyticsInsight[]> {
    return this.http.get<AnalyticsInsight[]>(`${this.base}/analytics/insights`, {
      params: this.params({ ...filters }),
    });
  }

  private params(filters: Record<string, string | undefined>): HttpParams {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });
    return params;
  }
}
