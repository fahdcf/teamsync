import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Workspace, CreateWorkspaceRequest } from '../shared/models/workspace.model';
import { User } from '../shared/models/user.model';

export interface WorkspaceActivity {
  id: string;
  user: User | null;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export interface WorkspaceSummary {
  projectCount: number;
  activeTaskCount: number;
  completedTaskCount: number;
  overdueCount: number;
  averageProgress: number;
  onTrackCount: number;
  atRiskCount: number;
  overdueProjectCount: number;
  activityLevel: string;
  engagementLevel: string;
  progressStatus: string;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getAll(): Observable<Workspace[]> {
    return this.http.get<Workspace[]>(`${this.base}/workspaces`);
  }

  getById(id: string): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.base}/workspaces/${id}`);
  }

  getSummary(id: string): Observable<WorkspaceSummary> {
    return this.http.get<WorkspaceSummary>(`${this.base}/workspaces/${id}/summary`);
  }

  create(req: CreateWorkspaceRequest): Observable<Workspace> {
    return this.http.post<Workspace>(`${this.base}/workspaces`, req);
  }

  addMember(id: string, email: string): Observable<Workspace> {
    return this.http.post<Workspace>(`${this.base}/workspaces/${id}/members`, { email });
  }

  removeMember(workspaceId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/workspaces/${workspaceId}/members/${userId}`);
  }

  getActivity(id: string): Observable<WorkspaceActivity[]> {
    return this.http.get<WorkspaceActivity[]>(`${this.base}/workspaces/${id}/activity`);
  }
}
