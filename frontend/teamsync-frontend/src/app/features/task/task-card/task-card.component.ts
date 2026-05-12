import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Task } from '../../../shared/models/task.model';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="tc" [class.done]="task.status === 'DONE'" [class.readonly]="readonly" (click)="!readonly && cardClick.emit()">
      <!-- Title -->
      <div class="tc-title">{{ task.title }}</div>

      <!-- Priority -->
      <div class="tc-priority" [class]="task.priority.toLowerCase()">
        <span class="pri-dot"></span>
        <span>{{ task.priority | titlecase }}</span>
      </div>

      <!-- Footer: avatar(s) | date | comments -->
      <div class="tc-footer">
        <div class="tc-avatars">
          <span class="tc-av" *ngIf="task.assignee">{{ initials(task.assignee) }}</span>
        </div>
        <div class="tc-date" [class.overdue]="isOverdue">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M5 1.5v3M11 1.5v3M2 7h12"/></svg>
          {{ task.dueDate ? (task.dueDate | date:'MMM d') : '—' }}
        </div>
        <div class="tc-comments">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h12v8H6l-4 3v-3z" stroke-linejoin="round"/></svg>
          {{ commentCount }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tc {
      width: 100%;
      padding: 16px;
      border: 1px solid #262626;
      border-radius: 12px;
      background: #1b1b1b;
      color: #f9fafb;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 12px;
      text-align: left;
      transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
    }
    .tc:not(.readonly):hover {
      background: #202020;
      border-color: #333;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    .tc.readonly { cursor: default; }
    .tc.done { opacity: 0.6; }
    .tc.done .tc-title { text-decoration: line-through; color: var(--text-tertiary); }

    .tc-title {
      font-size: 14px;
      font-weight: 500;
      color: #fff;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .tc-priority {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
    }
    .tc-priority.low      { color: #4ade80; }
    .tc-priority.medium   { color: #f59e0b; }
    .tc-priority.high     { color: #ef4444; }
    .tc-priority.critical { color: #ff3333; }

    .pri-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
      background: currentColor;
      box-shadow: 0 0 6px currentColor;
    }

    .tc-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      color: var(--text-tertiary);
      font-size: 11px;
      margin-top: 4px;
    }

    .tc-avatars { display: flex; flex: 1; }
    .tc-av, .tc-av-empty {
      width: 24px; height: 24px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center; justify-content: center;
      font-size: 9px; font-weight: 600;
    }
    .tc-av {
      background: #374151;
      color: #f9fafb;
      border: 1.5px solid #1b1b1b;
    }
    .tc-av-empty {
      border: 1px dashed rgba(255,255,255,0.1);
      color: var(--text-tertiary);
    }

    .tc-date {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 70px;
      justify-content: flex-start;
    }
    .tc-comments {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 30px;
      justify-content: flex-end;
    }
    .tc-date.overdue { color: var(--danger); }
  `]
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Input() selected = false;
  @Input() commentCount = 0;
  @Input() readonly = false;
  @Output() cardClick = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  get isOverdue(): boolean {
    if (!this.task.dueDate) return false;
    return new Date(this.task.dueDate) < new Date() && this.task.status !== 'DONE';
  }

  initials(user: User): string {
    return user.username
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
