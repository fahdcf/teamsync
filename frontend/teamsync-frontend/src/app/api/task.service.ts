import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Task, CreateTaskRequest, ChangeStatusRequest, CreateSubtaskRequest, Subtask, TaskPriority, TaskStatus } from '../shared/models/task.model';

export interface TaskQuery {
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  workspaceId?: string;
  assigneeId?: string;
  keyword?: string;
  overdue?: boolean;
  dueFrom?: string;
  dueTo?: string;
  sort?: string;
  page?: number;
  size?: number;
}

export interface TaskPage {
  content: Task[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface SaveTaskTemplateRequest {
  templateName: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  defaultDueDays?: number;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getByProject(projectId: string, filters?: any): Observable<Task[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<Task[]>(`${this.base}/projects/${projectId}/tasks`, { params });
  }

  getAll(filters?: TaskQuery): Observable<TaskPage> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof TaskQuery];
        if (value !== undefined && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<TaskPage>(`${this.base}/tasks`, { params });
  }

  getBlockedByProject(projectId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.base}/projects/${projectId}/tasks/blocked`);
  }

  getById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.base}/tasks/${id}`);
  }

  create(projectId: string, req: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(`${this.base}/projects/${projectId}/tasks`, req);
  }

  update(id: string, req: Partial<CreateTaskRequest>): Observable<Task> {
    return this.http.put<Task>(`${this.base}/tasks/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tasks/${id}`);
  }

  changeStatus(id: string, req: ChangeStatusRequest): Observable<Task> {
    return this.http.put<Task>(`${this.base}/tasks/${id}/status`, req);
  }

  reorder(projectId: string, taskIds: string[]): Observable<void> {
    return this.http.put<void>(`${this.base}/projects/${projectId}/tasks/reorder`, { taskIds });
  }

  assign(id: string, userId: string): Observable<Task> {
    return this.http.put<Task>(`${this.base}/tasks/${id}/assign`, { userId });
  }

  addDependency(id: string, dependsOnId: string): Observable<Task> {
    return this.http.post<Task>(`${this.base}/tasks/${id}/dependencies`, { dependsOnTaskId: dependsOnId });
  }

  saveTemplate(projectId: string, req: SaveTaskTemplateRequest): Observable<unknown> {
    return this.http.post(`${this.base}/projects/${projectId}/templates`, req);
  }

  removeDependency(id: string, depId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tasks/${id}/dependencies/${depId}`);
  }

  undo(): Observable<void> {
    return this.http.post<void>(`${this.base}/tasks/undo`, {});
  }

  autoAssign(projectId: string, taskId: string, strategy: string): Observable<Task> {
    return this.http.post<Task>(
      `${this.base}/projects/${projectId}/tasks/auto-assign?strategy=${strategy}`,
      { taskId }
    );
  }

  createSubtask(taskId: string, req: CreateSubtaskRequest): Observable<Subtask> {
    return this.http.post<Subtask>(`${this.base}/tasks/${taskId}/subtasks`, req);
  }

  toggleSubtask(taskId: string, subtaskId: string): Observable<Subtask> {
    return this.http.put<Subtask>(`${this.base}/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {});
  }

  updateSubtask(taskId: string, subtaskId: string, req: CreateSubtaskRequest): Observable<Subtask> {
    return this.http.put<Subtask>(`${this.base}/tasks/${taskId}/subtasks/${subtaskId}`, req);
  }

  deleteSubtask(taskId: string, subtaskId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tasks/${taskId}/subtasks/${subtaskId}`);
  }
}
