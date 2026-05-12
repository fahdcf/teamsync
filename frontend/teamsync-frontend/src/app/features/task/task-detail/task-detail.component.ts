import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ActivatedRoute } from '@angular/router';
import { TaskService } from '../../../api/task.service';
import { CommentService } from '../../../api/comment.service';
import { AuthStore } from '../../../store/auth.store';
import { Task, TaskStatus, TaskPriority } from '../../../shared/models/task.model';
import { Comment } from '../../../shared/models/comment.model';
import { User } from '../../../shared/models/user.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

type BadgeVariant = 'muted' | 'info' | 'warning' | 'danger' | 'accent' | 'success';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    AvatarComponent, BadgeComponent, ButtonComponent,
    SkeletonComponent, RelativeTimePipe, EmptyStateComponent
  ],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('200ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)' }))
      ])
    ])
  ],
  template: `
    <div class="backdrop" (click)="closed.emit()"></div>
    <div class="drawer" @slideIn>
      <!-- Header -->
      <div class="drawer-header">
        <button class="close-btn" (click)="closed.emit()">✕</button>
        <div class="drawer-actions">
          <app-button variant="ghost" size="sm" (click)="undoLastAction()">Undo</app-button>
          <app-button *ngIf="canDelete" variant="danger" size="sm" (click)="deleteTask()">Delete</app-button>
        </div>
      </div>

      <div *ngIf="isLoading" class="loading-center">
        <div class="skeleton-drawer">
          <app-skeleton type="text"></app-skeleton>
          <app-skeleton type="text"></app-skeleton>
          <app-skeleton type="card"></app-skeleton>
        </div>
      </div>

      <app-empty-state
        *ngIf="!isLoading && hasError"
        variant="error"
        description="Failed to load task"
        (action)="load()">
      </app-empty-state>

      <div *ngIf="!isLoading && !hasError && task" class="drawer-body">
        <!-- Main column -->
        <div class="drawer-main">
          <!-- Editable title -->
          <h2 *ngIf="!isEditingTitle" (click)="isEditingTitle = true" class="task-title">
            {{ task.title }}
          </h2>
          <input *ngIf="isEditingTitle" class="title-input"
            [value]="task.title"
            (blur)="onTitleBlur($event)"
            autofocus>

          <!-- Editable description -->
          <p *ngIf="!isEditingDescription" (click)="isEditingDescription = true" class="task-desc">
            {{ task.description || 'Add description…' }}
          </p>
          <textarea *ngIf="isEditingDescription" class="desc-input"
            [value]="task.description"
            (blur)="onDescBlur($event)"
            autofocus></textarea>

          <!-- Dependencies -->
          <div *ngIf="task.dependencies?.length" class="dep-section">
            <h4>Blocked by</h4>
            <div *ngFor="let dep of task.dependencies" class="dep-item">
              <app-badge [text]="dep.status" [variant]="statusVariant(dep.status)"></app-badge>
              <span class="dep-title">{{ dep.title }}</span>
            </div>
          </div>

          <!-- Comments -->
          <div class="comments-section">
            <h4>Comments ({{ comments.length }})</h4>

            <app-empty-state
              *ngIf="!comments.length"
              title="No comments"
              description="Start the conversation"
              [minimal]="true">
            </app-empty-state>

            <div *ngFor="let comment of comments" class="comment">
              <app-avatar [user]="comment.author" size="sm"></app-avatar>
              <div class="comment-body">
                <div class="comment-header">
                  <strong>{{ comment.author.username }}</strong>
                  <span class="comment-time">{{ comment.createdAt | relativeTime }}</span>
                  <button *ngIf="canDeleteComment(comment)" class="del-btn" (click)="deleteComment(comment.id)">✕</button>
                </div>
                <p class="comment-text">{{ comment.content }}</p>
                <button class="reply-btn" (click)="replyingToId = comment.id">Reply</button>
                <div *ngIf="replyingToId === comment.id" class="reply-form">
                  <textarea class="reply-input" [(ngModel)]="replyText" placeholder="Write a reply…"></textarea>
                  <app-button size="sm" (click)="submitReply(comment.id)">Send</app-button>
                </div>
                <div *ngFor="let reply of comment.replies" class="reply">
                  <app-avatar [user]="reply.author" size="sm"></app-avatar>
                  <div class="reply-body">
                    <strong>{{ reply.author.username }}</strong>
                    <p class="comment-text">{{ reply.content }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="new-comment">
              <app-avatar [user]="currentUser" size="sm"></app-avatar>
              <div class="new-comment-input">
                <textarea class="comment-input" [(ngModel)]="newCommentText" placeholder="Add a comment…"></textarea>
                <app-button size="sm" (click)="submitComment()" [disabled]="!newCommentText.trim()">Comment</app-button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="drawer-sidebar">
          <div class="meta-field">
            <label>Status</label>
            <select class="meta-select" [ngModel]="task.status" (ngModelChange)="onStatusChange($event)">
              <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
            </select>
          </div>
          <div class="meta-field">
            <label>Priority</label>
            <select class="meta-select" [ngModel]="task.priority" (ngModelChange)="onPriorityChange($event)">
              <option *ngFor="let p of priorities" [value]="p">{{ p }}</option>
            </select>
          </div>
          <div class="meta-field">
            <label>Due Date</label>
            <input type="date" class="meta-input" [ngModel]="task.dueDate" (ngModelChange)="onDueDateChange($event)">
          </div>
          <div class="meta-field">
            <label>Created</label>
            <span class="meta-value">{{ task.createdAt | date:'MMM d, y' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 300;
    }
    .drawer {
      position: fixed; top: 0; right: 0; width: 640px; height: 100vh;
      background: var(--color-surface); border-left: 1px solid var(--color-border);
      box-shadow: var(--shadow-lg); z-index: 301;
      display: flex; flex-direction: column; overflow: hidden;
    }
    @media (max-width: 768px) { .drawer { width: 100vw; } }
    .drawer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid var(--color-border); flex-shrink: 0;
    }
    .close-btn {
      background: none; border: none; color: var(--color-muted); font-size: 18px;
    }
    .close-btn:hover { color: var(--color-text); }
    .drawer-actions { display: flex; gap: 8px; }
    .loading-center { padding: 24px; }
    .skeleton-drawer { display: flex; flex-direction: column; gap: 12px; }
    .drawer-body {
      display: flex; gap: 0; flex: 1; overflow: hidden;
    }
    .drawer-main {
      flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px;
    }
    .task-title {
      margin: 0; font-size: 20px; font-weight: 700; cursor: pointer;
    }
    .task-title:hover { text-decoration: underline; }
    .title-input {
      background: none; border: none; border-bottom: 2px solid var(--color-accent);
      color: var(--color-text); font-size: 20px; font-weight: 700;
      outline: none; width: 100%;
    }
    .task-desc { margin: 0; color: var(--color-muted); font-size: 14px; cursor: pointer; min-height: 24px; }
    .task-desc:hover { color: var(--color-text); }
    .desc-input {
      width: 100%; background: var(--color-surface); border: 1px solid var(--color-accent);
      border-radius: var(--radius-sm); color: var(--color-text); font-size: 14px;
      padding: 8px; outline: none; resize: vertical; min-height: 80px;
    }
    .dep-section h4, .comments-section h4 { margin: 0 0 10px; font-size: 14px; font-weight: 600; }
    .dep-item { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .dep-title { font-size: 13px; }
    .comment { display: flex; gap: 10px; margin-bottom: 12px; }
    .comment-body { flex: 1; }
    .comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 13px; }
    .comment-time { font-size: 11px; color: var(--color-muted); flex: 1; }
    .comment-text { margin: 0; font-size: 13px; }
    .del-btn { background: none; border: none; color: var(--color-muted); font-size: 12px; }
    .reply-btn { background: none; border: none; color: var(--color-accent); font-size: 12px; margin-top: 4px; }
    .reply-form { display: flex; gap: 8px; align-items: flex-end; margin-top: 8px; }
    .reply-input {
      flex: 1; background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); color: var(--color-text); font-size: 13px;
      padding: 6px; outline: none; resize: none; height: 48px;
    }
    .reply { display: flex; gap: 8px; margin-top: 8px; padding-left: 16px; }
    .reply-body strong { font-size: 12px; }
    .new-comment { display: flex; gap: 10px; margin-top: 16px; }
    .new-comment-input { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .comment-input {
      width: 100%; background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); color: var(--color-text); font-size: 13px;
      padding: 8px 10px; outline: none; resize: none; height: 72px;
    }
    .comment-input:focus { border-color: var(--color-accent); }
    .drawer-sidebar {
      width: 200px; flex-shrink: 0; padding: 20px 16px;
      border-left: 1px solid var(--color-border); overflow-y: auto;
      display: flex; flex-direction: column; gap: 16px;
    }
    .meta-field { display: flex; flex-direction: column; gap: 4px; }
    .meta-field label { font-size: 11px; font-weight: 600; color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-select, .meta-input {
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); color: var(--color-text);
      padding: 6px 8px; font-size: 13px; outline: none;
    }
    .meta-select:focus, .meta-input:focus { border-color: var(--color-accent); }
    .meta-value { font-size: 13px; color: var(--color-muted); }
  `]
})
export default class TaskDetailComponent implements OnInit {
  @Input() taskId = '';
  @Output() closed = new EventEmitter<void>();

  private readonly taskService = inject(TaskService);
  private readonly commentService = inject(CommentService);
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);

  task: Task | null = null;
  comments: Comment[] = [];
  isLoading = true;
  hasError = false;
  isEditingTitle = false;
  isEditingDescription = false;
  newCommentText = '';
  replyingToId: string | null = null;
  replyText = '';

  get currentUser(): User | null { return this.authStore.getUser(); }
  get canDelete(): boolean {
    const role = this.authStore.getUser()?.role;
    return role === 'ADMIN' || role === 'PROJECT_MANAGER';
  }

  readonly statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'DONE'];
  readonly priorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  statusVariant(status: TaskStatus): BadgeVariant {
    const map: Record<string, BadgeVariant> = {
      TODO: 'muted', IN_PROGRESS: 'accent', BLOCKED: 'danger',
      IN_REVIEW: 'warning', DONE: 'success'
    };
    return map[status] ?? 'muted';
  }

  canDeleteComment(comment: Comment): boolean {
    const user = this.authStore.getUser();
    return user?.id === comment.author.id || user?.role === 'ADMIN';
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.hasError = false;
    const id = this.taskId || this.route.snapshot.paramMap.get('id') || '';
    this.taskService.getById(id).subscribe({
      next: t => {
        this.task = t;
        this.commentService.getByTask(id).subscribe({
          next: c => { this.comments = c; this.isLoading = false; },
          error: () => { this.hasError = true; this.isLoading = false; }
        });
      },
      error: () => { this.hasError = true; this.isLoading = false; }
    });
  }

  onTitleBlur(event: Event): void {
    this.isEditingTitle = false;
    const val = (event.target as HTMLInputElement).value.trim();
    if (val && val !== this.task?.title) {
      this.taskService.update(this.task!.id, { title: val }).subscribe({ next: t => { this.task = t; } });
    }
  }

  onDescBlur(event: Event): void {
    this.isEditingDescription = false;
    const val = (event.target as HTMLTextAreaElement).value.trim();
    if (val !== this.task?.description) {
      this.taskService.update(this.task!.id, { description: val }).subscribe({ next: t => { this.task = t; } });
    }
  }

  onStatusChange(status: TaskStatus): void {
    this.taskService.changeStatus(this.task!.id, { status }).subscribe({ next: t => { this.task = t; } });
  }

  onPriorityChange(priority: TaskPriority): void {
    this.taskService.update(this.task!.id, { priority }).subscribe({ next: t => { this.task = t; } });
  }

  onDueDateChange(date: string): void {
    this.taskService.update(this.task!.id, { dueDate: date }).subscribe({ next: t => { this.task = t; } });
  }

  submitComment(): void {
    if (!this.newCommentText.trim()) return;
    this.commentService.add(this.task!.id, this.newCommentText).subscribe({
      next: c => { this.comments = [c, ...this.comments]; this.newCommentText = ''; }
    });
  }

  submitReply(commentId: string): void {
    if (!this.replyText.trim()) return;
    this.commentService.reply(commentId, this.replyText).subscribe({
      next: reply => {
        const parent = this.comments.find(c => c.id === commentId);
        if (parent) parent.replies = [...(parent.replies || []), reply];
        this.replyingToId = null;
        this.replyText = '';
      }
    });
  }

  deleteComment(commentId: string): void {
    this.commentService.delete(commentId).subscribe({
      next: () => { this.comments = this.comments.filter(c => c.id !== commentId); }
    });
  }

  undoLastAction(): void {
    this.taskService.undo().subscribe({
      next: () => {
        this.taskService.getById(this.task!.id).subscribe({ next: t => { this.task = t; } });
      }
    });
  }

  deleteTask(): void {
    this.taskService.delete(this.task!.id).subscribe({
      next: () => this.closed.emit()
    });
  }
}
