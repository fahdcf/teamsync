import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Task } from '../../../shared/models/task.model';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';

type BadgeVariant = 'muted' | 'info' | 'warning' | 'danger' | 'accent' | 'success';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, DatePipe, BadgeComponent, AvatarComponent, TruncatePipe],
  template: `
    <div class="task-card" (click)="cardClick.emit()">
      <div class="card-header">
        <app-badge [text]="task.priority" [variant]="priorityVariant"></app-badge>
        <div class="card-actions" (click)="$event.stopPropagation()">
          <button class="icon-btn" (click)="confirmDelete()" title="Delete task">🗑</button>
        </div>
      </div>
      <h4 class="card-title">{{ task.title | truncate:60 }}</h4>
      <div class="card-footer">
        <span class="due-date"
          [class.overdue]="isOverdue"
          *ngIf="task.dueDate">
          {{ task.dueDate | date:'MMM d' }}
        </span>
        <app-avatar *ngIf="task.assignee" [user]="task.assignee" size="sm"></app-avatar>
      </div>
    </div>
  `,
  styles: [`
    .task-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 12px;
      cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .task-card:hover { border-color: var(--color-accent); box-shadow: var(--shadow-sm); }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .card-actions { opacity: 0; transition: opacity 0.1s; }
    .task-card:hover .card-actions { opacity: 1; }
    .icon-btn { background: none; border: none; cursor: pointer; padding: 2px; font-size: 14px; }
    .card-title { margin: 0 0 10px; font-size: 13px; font-weight: 500; line-height: 1.4; }
    .card-footer { display: flex; align-items: center; justify-content: space-between; }
    .due-date { font-size: 11px; color: var(--color-muted); }
    .due-date.overdue { color: var(--color-danger); }
  `]
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Output() cardClick = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  get isOverdue(): boolean {
    if (!this.task.dueDate) return false;
    return new Date(this.task.dueDate) < new Date() && this.task.status !== 'DONE';
  }

  get priorityVariant(): BadgeVariant {
    const map: Record<string, BadgeVariant> = {
      LOW: 'muted', MEDIUM: 'info', HIGH: 'warning', CRITICAL: 'danger'
    };
    return map[this.task.priority] ?? 'muted';
  }

  confirmDelete(): void {
    if (confirm(`Delete task "${this.task.title}"?`)) {
      this.deleted.emit();
    }
  }
}
