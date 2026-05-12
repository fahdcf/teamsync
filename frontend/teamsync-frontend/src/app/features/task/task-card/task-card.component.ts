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
      class="task-card-redesign"
      [class.selected]="selected"
      [class.done]="task.status === 'DONE'"
      (click)="cardClick.emit()"
    >
      <div class="task-title-row">
        <span class="done-check" *ngIf="task.status === 'DONE'">✓</span>
        <strong>{{ task.title }}</strong>
      </div>

      <div class="priority-row">
        <span class="priority-dot" [class]="task.priority.toLowerCase()"></span>
        <span>{{ task.priority | titlecase }}</span>
      </div>

      <div class="task-footer-row">
        <span class="avatar-stack" *ngIf="task.assignee; else unassigned">
          <span>{{ initials(task.assignee) }}</span>
        </span>
        <ng-template #unassigned>
          <span class="unassigned-avatar">+</span>
        </ng-template>

        <time [class.overdue]="isOverdue" *ngIf="task.dueDate">{{ task.dueDate | date:'MMM d' }}</time>
        <time *ngIf="!task.dueDate">No date</time>

        <span class="comment-count">◌ {{ commentCount }}</span>
      </div>
    </button>
  `,
  styles: [
    `
      .task-card-redesign {
        width: 100%;
        margin-bottom: 8px;
        padding: 14px 16px;
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-lg);
        background: var(--bg-elevated);
        color: var(--text-primary);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 11px;
        text-align: left;
        transition: background 0.15s, border-color 0.15s;
      }

      .task-card-redesign:hover {
        background: #222228;
        border-color: var(--border-default);
      }

      .task-card-redesign.selected {
        border-left: 3px solid var(--accent);
        background: rgba(212, 168, 83, 0.05);
      }

      .task-card-redesign.done {
        opacity: 0.7;
      }

      .task-title-row {
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }

      .task-title-row strong {
        color: var(--text-primary);
        font-size: 13px;
        font-weight: 500;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .done .task-title-row strong {
        color: var(--text-tertiary);
        text-decoration: line-through;
      }

      .done-check {
        width: 16px;
        height: 16px;
        border-radius: var(--radius-full);
        background: var(--success-dim);
        color: var(--success);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        flex-shrink: 0;
      }

      .priority-row {
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 12px;
      }

      .priority-dot {
        width: 6px;
        height: 6px;
        border-radius: var(--radius-full);
        background: rgba(255, 255, 255, 0.2);
      }

      .priority-dot.medium {
        background: var(--info);
      }

      .priority-dot.high {
        background: var(--warning);
      }

      .priority-dot.critical {
        background: var(--danger);
      }

      .task-footer-row {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 8px;
        color: var(--text-tertiary);
        font-size: 11px;
      }

      .avatar-stack {
        display: flex;
      }

      .avatar-stack span,
      .unassigned-avatar {
        width: 24px;
        height: 24px;
        border-radius: var(--radius-full);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 600;
      }

      .avatar-stack span {
        border: 1px solid var(--border-default);
        background: linear-gradient(135deg, #c18c60, #2f5874);
        color: #fff;
      }

      .unassigned-avatar {
        border: 1px dashed var(--border-default);
        color: var(--text-tertiary);
      }

      time {
        justify-self: center;
      }

      time.overdue {
        color: var(--danger);
      }

      .comment-count {
        justify-self: end;
      }
    `,
  ],
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
