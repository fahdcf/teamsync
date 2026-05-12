import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Project, CreateProjectRequest } from '../shared/models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getByWorkspace(workspaceId: string): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.base}/workspaces/${workspaceId}/projects`);
  }

  getById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.base}/projects/${id}`);
  }

  create(workspaceId: string, req: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(`${this.base}/workspaces/${workspaceId}/projects`, req);
  }

  update(id: string, req: Partial<CreateProjectRequest>): Observable<Project> {
    return this.http.put<Project>(`${this.base}/projects/${id}`, req);
  }

  archive(id: string): Observable<Project> {
    return this.http.put<Project>(`${this.base}/projects/${id}/archive`, {});
  }

  initialize(data: any): Observable<Project> {
    return this.http.post<Project>(`${this.base}/projects/initialize`, data);
  }
}
