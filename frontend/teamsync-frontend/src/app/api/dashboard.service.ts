import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TaskPriority } from '../shared/models/task.model';
import { ProjectStatus } from '../shared/models/project.model';
import { User } from '../shared/models/user.model';

export interface DashboardStats {
  activeTasks: number;
  completionRate: number;
  teamVelocity: number;
  overdueItems: number;
  trendActiveTasks: number;
  trendCompletion: number;
  trendVelocity: number;
  trendOverdue: number;
}

export interface DashboardDeadline {
  id: string;
  title: string;
  dueDate: string | null;
  priority: TaskPriority;
  project: {
    title: string;
  };
}

export interface DashboardProjectOverview {
  id: string;
  title: string;
  progress: number;
  status: ProjectStatus;
  taskCount: number;
}

export interface DashboardDateRange {
  from: string;
  to: string;
}

export interface DashboardChartSeries {
  dayLabels: string[];
  completionSeries: number[];
  workloadSeries: number[];
}

export interface DashboardTeamWorkSummary {
  user: User;
  activeTaskTitle: string | null;
  activeTaskCount: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getStats(range?: DashboardDateRange): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/dashboard/stats`, { params: this.rangeParams(range) });
  }

  getUpcomingDeadlines(range?: DashboardDateRange): Observable<DashboardDeadline[]> {
    return this.http.get<DashboardDeadline[]>(`${this.base}/dashboard/upcoming-deadlines`, { params: this.rangeParams(range) });
  }

  getProjectsOverview(): Observable<DashboardProjectOverview[]> {
    return this.http.get<DashboardProjectOverview[]>(`${this.base}/dashboard/projects-overview`);
  }

  getChartSeries(range?: DashboardDateRange): Observable<DashboardChartSeries> {
    return this.http.get<DashboardChartSeries>(`${this.base}/dashboard/chart-series`, { params: this.rangeParams(range) });
  }

  getTeamWorkload(): Observable<DashboardTeamWorkSummary[]> {
    return this.http.get<DashboardTeamWorkSummary[]>(`${this.base}/dashboard/team-workload`);
  }

  private rangeParams(range?: DashboardDateRange): HttpParams {
    let params = new HttpParams();
    if (!range) return params;
    params = params.set('from', range.from);
    params = params.set('to', range.to);
    return params;
  }
}
