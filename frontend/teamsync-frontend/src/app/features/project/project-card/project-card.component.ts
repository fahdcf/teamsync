import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../shared/models/project.model';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';

type BadgeVariant = 'muted' | 'accent' | 'warning' | 'success' | 'info' | 'danger';

@Component({
  selector: 'app-project-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BadgeComponent, AvatarComponent, ProgressBarComponent],
  template: `
    <div class="project-card" (click)="clicked.emit()">
      <div class="card-header">
        <h3 class="card-title">{{ project.title }}</h3>
        <app-badge [text]="project.status" [variant]="statusVariant"></app-badge>
      </div>
      <app-progress-bar [value]="project.progress" class="progress"></app-progress-bar>
      <div class="card-footer">
        <span class="deadline" [class.overdue]="isOverdue">
          {{ isOverdue ? 'Overdue' : project.deadline }}
        </span>
        <div class="manager">
          <app-avatar [user]="project.manager" size="sm"></app-avatar>
          <span class="manager-name">{{ project.manager.username }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .project-card {
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); padding: 20px; cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
      display: flex; flex-direction: column; gap: 12px;
    }
    .project-card:hover { border-color: var(--color-accent); box-shadow: var(--shadow-md); }
    .card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    .card-title { margin: 0; font-size: 15px; font-weight: 600; }
    .progress { display: block; }
    .card-footer { display: flex; align-items: center; justify-content: space-between; }
    .deadline { font-size: 12px; color: var(--color-muted); }
    .deadline.overdue { color: var(--color-danger); }
    .manager { display: flex; align-items: center; gap: 6px; }
    .manager-name { font-size: 12px; color: var(--color-muted); }
  `]
})
export class ProjectCardComponent {
  @Input({ required: true }) project!: Project;
  @Output() clicked = new EventEmitter<void>();

  get isOverdue(): boolean {
    if (!this.project.deadline) return false;
    return new Date(this.project.deadline) < new Date() && this.project.status !== 'COMPLETED';
  }

  get statusVariant(): BadgeVariant {
    const map: Record<string, BadgeVariant> = {
      PLANNING: 'muted', ACTIVE: 'accent', ON_HOLD: 'warning',
      COMPLETED: 'success', ARCHIVED: 'muted'
    };
    return map[this.project.status] ?? 'muted';
  }
}
