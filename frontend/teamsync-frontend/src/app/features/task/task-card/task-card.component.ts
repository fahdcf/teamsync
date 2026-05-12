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
    <button
      type="button"
      class="tc"
      [class.tc--done]="task.status === 'DONE'"
      (click)="cardClick.emit()"
    >
      <!-- Title -->
      <p class="tc-title">{{ task.title }}</p>

      <!-- Priority badge -->
      <div class="tc-priority" [class]="'p-' + task.priority.toLowerCase()">
        <span class="tc-dot"></span>
        <span class="tc-prio-label">{{ priorityLabel }}</span>
      </div>

      <!-- Footer row: avatar | date | comments -->
      <div class="tc-footer">
        <!-- Assignee avatars -->
        <div class="tc-avatars">
          <span class="tc-avatar" *ngIf="task.assignee; else noAssignee">
            {{ initials(task.assignee) }}
          </span>
          <ng-template #noAssignee>
            <span class="tc-avatar tc-avatar--empty">—</span>
          </ng-template>
        </div>

        <!-- Due date -->
        <div class="tc-date" [class.tc-date--overdue]="isOverdue" *ngIf="task.dueDate">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="3" width="12" height="11" rx="1.5"/>
            <path d="M4 1.5v3M12 1.5v3M2 7h12"/>
          </svg>
          {{ task.dueDate | date:'MMM d' }}
        </div>

        <!-- Comment count -->
        <div class="tc-comments">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5l-3 2V3Z"/>
          </svg>
          {{ commentCount }}
        </div>
      </div>
    </button>
  `,
  styles: [`
    .tc {
      width: 100%;
      padding: 12px 14px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      color: var(--text-primary);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 10px;
      text-align: left;
      transition: background 0.12s, border-color 0.12s, box-shadow 0.12s;
    }

    .tc:hover {
      background: #202024;
      border-color: var(--border-default);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .tc--done { opacity: 0.6; }

    /* Title */
    .tc-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1.4;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .tc--done .tc-title {
      text-decoration: line-through;
      color: var(--text-tertiary);
    }

    /* Priority badge */
    .tc-priority {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .tc-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* Priority colors */
    .p-low    { color: var(--success); }
    .p-low    .tc-dot { background: var(--success); }
    .p-medium { color: var(--warning); }
    .p-medium .tc-dot { background: var(--warning); }
    .p-high   { color: var(--danger); }
    .p-high   .tc-dot { background: var(--danger); }
    .p-critical { color: #ff2222; }
    .p-critical .tc-dot { background: #ff2222; }

    /* Footer row */
    .tc-footer {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Avatars */
    .tc-avatars { display: flex; }
    .tc-avatar {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: linear-gradient(135deg, #c18c60, #2f5874);
      border: 1.5px solid var(--bg-elevated);
      color: #fff;
      font-size: 8px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: -6px;
    }
    .tc-avatar--empty {
      background: var(--bg-surface);
      border: 1.5px dashed var(--border-default);
      color: var(--text-tertiary);
      font-size: 10px;
    }

    /* Date */
    .tc-date {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--text-tertiary);
      margin-left: auto;
    }
    .tc-date--overdue { color: var(--danger); }

    /* Comments */
    .tc-comments {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--text-tertiary);
    }
  `],
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Input() selected = false;
  @Input() commentCount = 0;
  @Output() cardClick = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  get isOverdue(): boolean {
    if (!this.task.dueDate) return false;
    return new Date(this.task.dueDate) < new Date() && this.task.status !== 'DONE';
  }

  get priorityLabel(): string {
    const map: Record<string, string> = {
      LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical'
    };
    return map[this.task.priority] ?? this.task.priority;
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
