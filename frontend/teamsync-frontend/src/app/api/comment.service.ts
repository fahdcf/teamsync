import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Comment } from '../shared/models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getByTask(taskId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.base}/tasks/${taskId}/comments`);
  }

  add(taskId: string, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.base}/tasks/${taskId}/comments`, { content });
  }

  reply(commentId: string, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.base}/comments/${commentId}/replies`, { content });
  }

  delete(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/comments/${commentId}`);
  }
}
