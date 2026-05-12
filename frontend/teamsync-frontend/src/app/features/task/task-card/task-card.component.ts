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
    <button type="button" class="tc" [class.done]="task.status === 'DONE'" (click)="cardClick.emit()">
      <!-- Title -->
      <div class="tc-title">{{ task.title }}</div>

      <!-- Priority -->
      <div class="tc-priority">
        <span class="pri-dot" [class]="task.priority.toLowerCase()"></span>
        <span>{{ task.priority | titlecase }}</span>
      </div>

      <!-- Footer: avatar(s) | date | comments -->
      <div class="tc-footer">
        <div class="tc-avatars">
          <span class="tc-av" *ngIf="task.assignee">{{ initials(task.assignee) }}</span>
          <span class="tc-av-empty" *ngIf="!task.assignee">+</span>
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
    </button>
  `,
  styles: [`
    .tc {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      background: var(--bg-elevated);
      color: var(--text-primary);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 10px;
      text-align: left;
      transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
    }
    .tc:hover {
      background: #222228;
      border-color: var(--border-default);
      box-shadow: var(--shadow-sm);
    }
    .tc.done { opacity: 0.6; }
    .tc.done .tc-title { text-decoration: line-through; color: var(--text-tertiary); }

    .tc-title {
      font-size: 13px;
      font-weight: 500;
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
      color: var(--text-secondary);
    }

    .pri-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .pri-dot.low      { background: var(--success); }
    .pri-dot.medium   { background: var(--warning); }
    .pri-dot.high     { background: var(--danger); }
    .pri-dot.critical { background: #ff3333; }

    .tc-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      color: var(--text-tertiary);
      font-size: 11px;
      margin-top: 2px;
    }

    .tc-avatars { display: flex; }
    .tc-av, .tc-av-empty {
      width: 24px; height: 24px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center; justify-content: center;
      font-size: 9px; font-weight: 600;
    }
    .tc-av {
      background: linear-gradient(135deg, #c18c60, #2f5874);
      color: #fff;
      border: 1.5px solid var(--bg-elevated);
    }
    .tc-av-empty {
      border: 1px dashed var(--border-default);
      color: var(--text-tertiary);
    }

    .tc-date, .tc-comments {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .tc-date.overdue { color: var(--danger); }
  `]
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

  initials(user: User): string {
    return user.username
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
