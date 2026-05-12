import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../../api/project.service';
import { Project } from '../../../shared/models/project.model';
import { AuthStore } from '../../../store/auth.store';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ProjectAnalyticsComponent } from '../project-analytics/project-analytics.component';
import { ProjectSettingsComponent } from '../project-settings/project-settings.component';
import TaskBoardComponent from '../../task/task-board/task-board.component';

type Tab = 'board' | 'analytics' | 'settings';
type BadgeVariant = 'muted' | 'accent' | 'warning' | 'success' | 'info' | 'danger';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule, BadgeComponent, ButtonComponent,
    SkeletonComponent, EmptyStateComponent,
    ProjectAnalyticsComponent, ProjectSettingsComponent, TaskBoardComponent
  ],
  template: `
    <div *ngIf="isLoading" class="skeleton-stack">
      <app-skeleton type="text"></app-skeleton>
      <app-skeleton type="list-item"></app-skeleton>
      <app-skeleton type="card"></app-skeleton>
    </div>

    <app-empty-state
      *ngIf="!isLoading && hasError"
      variant="error"
      description="Failed to load project"
      (action)="load()">
    </app-empty-state>

    <div *ngIf="!isLoading && !hasError && project" class="project-detail">
      <!-- Header -->
      <div class="project-header">
        <div class="header-left">
          <h1 *ngIf="!isEditingTitle" (click)="isEditingTitle = true" class="project-title">{{ project.title }}</h1>
          <input *ngIf="isEditingTitle"
            class="title-input"
            [value]="project.title"
            (blur)="onTitleBlur($event)"
            autofocus>
          <div class="project-meta">
            <app-badge [text]="project.status" [variant]="statusVariant"></app-badge>
            <span class="deadline" [class.overdue]="isOverdue">
              {{ isOverdue ? 'Overdue' : daysLeft + ' days left' }}
            </span>
          </div>
        </div>
        <app-button *ngIf="canArchive && project.status !== 'ARCHIVED'" variant="danger" size="sm"
          (click)="archiveProject()">
          Archive
        </app-button>
      </div>

      <!-- Tab nav -->
      <div class="tab-nav">
        <button *ngFor="let t of tabs"
          class="tab-btn"
          [class.active]="activeTab === t.key"
          (click)="activeTab = t.key">
          {{ t.label }}
        </button>
      </div>

      <!-- Tab content -->
      <div class="tab-content">
        <app-task-board *ngIf="activeTab === 'board'" [projectId]="project.id"></app-task-board>
        <app-project-analytics *ngIf="activeTab === 'analytics'" [projectId]="project.id"></app-project-analytics>
        <app-project-settings *ngIf="activeTab === 'settings'" [project]="project" (updated)="project = $event"></app-project-settings>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-stack { display: flex; flex-direction: column; gap: 12px; padding: 20px 0; }
    .project-detail { max-width: 1400px; }
    .project-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 16px; margin-bottom: 20px;
    }
    .project-title {
      margin: 0 0 8px; font-size: 24px; font-weight: 700; cursor: pointer;
    }
    .project-title:hover { text-decoration: underline; }
    .title-input {
      background: none; border: none; border-bottom: 2px solid var(--color-accent);
      color: var(--color-text); font-size: 24px; font-weight: 700;
      outline: none; margin-bottom: 8px; width: 100%;
    }
    .project-meta { display: flex; align-items: center; gap: 12px; }
    .deadline { font-size: 13px; color: var(--color-muted); }
    .deadline.overdue { color: var(--color-danger); }
    .tab-nav { display: flex; gap: 4px; margin-bottom: 24px; border-bottom: 1px solid var(--color-border); }
    .tab-btn {
      background: none; border: none; color: var(--color-muted);
      padding: 10px 16px; font-size: 14px; font-weight: 500;
      border-bottom: 2px solid transparent; margin-bottom: -1px;
      transition: color 0.15s, border-color 0.15s;
    }
    .tab-btn:hover { color: var(--color-text); }
    .tab-btn.active { color: var(--color-accent); border-bottom-color: var(--color-accent); }
  `]
})
export default class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);
  readonly authStore = inject(AuthStore);

  project: Project | null = null;
  isLoading = true;
  hasError = false;
  isEditingTitle = false;
  activeTab: Tab = 'board';

  readonly tabs = [
    { key: 'board' as Tab, label: 'Board' },
    { key: 'analytics' as Tab, label: 'Analytics' },
    { key: 'settings' as Tab, label: 'Settings' },
  ];

  get canArchive(): boolean {
    const role = this.authStore.getUser()?.role;
    return role === 'ADMIN' || role === 'PROJECT_MANAGER';
  }

  get statusVariant(): BadgeVariant {
    const map: Record<string, BadgeVariant> = {
      PLANNING: 'muted', ACTIVE: 'accent', ON_HOLD: 'warning',
      COMPLETED: 'success', ARCHIVED: 'muted'
    };
    return map[this.project?.status ?? ''] ?? 'muted';
  }

  get isOverdue(): boolean {
    if (!this.project?.deadline) return false;
    return new Date(this.project.deadline) < new Date() && this.project.status !== 'COMPLETED';
  }

  get daysLeft(): number {
    if (!this.project?.deadline) return 0;
    return Math.ceil((new Date(this.project.deadline).getTime() - Date.now()) / 86400000);
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.hasError = false;
    const id = this.route.snapshot.paramMap.get('id')!;
    this.projectService.getById(id).subscribe({
      next: p => { this.project = p; this.isLoading = false; },
      error: () => { this.hasError = true; this.isLoading = false; }
    });
  }

  onTitleBlur(event: Event): void {
    this.isEditingTitle = false;
    const newTitle = (event.target as HTMLInputElement).value.trim();
    if (newTitle && newTitle !== this.project?.title) {
      this.projectService.update(this.project!.id, { title: newTitle }).subscribe({
        next: p => { this.project = p; }
      });
    }
  }

  archiveProject(): void {
    this.projectService.archive(this.project!.id).subscribe({
      next: p => { this.project = p; }
    });
  }
}
