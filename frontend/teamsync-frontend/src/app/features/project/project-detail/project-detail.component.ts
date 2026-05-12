import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../../api/project.service';
import { Project, ProjectStatus } from '../../../shared/models/project.model';
import { AuthStore } from '../../../store/auth.store';
import { ProjectAnalyticsComponent } from '../project-analytics/project-analytics.component';
import { ProjectSettingsComponent } from '../project-settings/project-settings.component';
import TaskBoardComponent from '../../task/task-board/task-board.component';

type Tab = 'board' | 'analytics' | 'settings';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, ProjectAnalyticsComponent, ProjectSettingsComponent, TaskBoardComponent],
  template: `
    <!-- Loading -->
    <div class="pd" *ngIf="isLoading">
      <div class="pd-skeleton">
        <div class="sk sk-bar w40"></div>
        <div class="sk sk-bar w60"></div>
        <div class="sk sk-board"></div>
      </div>
    </div>

    <!-- Error -->
    <div class="pd" *ngIf="!isLoading && hasError">
      <div class="pd-error">
        <span class="err-icon">⚠</span>
        <p>Failed to load project</p>
        <button (click)="load()" type="button">Retry</button>
      </div>
    </div>

    <!-- Main -->
    <div class="pd" *ngIf="!isLoading && !hasError && project">

      <!-- Compact top bar: breadcrumb -->
      <div class="pd-breadcrumb">
        <span class="crumb link" (click)="router.navigate(['/workspaces'])">{{ project.workspace?.name || 'Workspace' }}</span>
        <span class="sep">›</span>
        <span class="crumb current">{{ project.title }}</span>
      </div>

      <!-- Title row -->
      <div class="pd-title-row">
        <div class="pd-title-left">
          <h1 *ngIf="!isEditingTitle" (click)="isEditingTitle = true">{{ project.title }}</h1>
          <input *ngIf="isEditingTitle" class="title-edit" [value]="project.title"
            (blur)="onTitleBlur($event)" (keydown.enter)="$any($event.target).blur()" autofocus />
          <span class="pd-status" [class]="project.status.toLowerCase().replace('_','-')">{{ statusLabel(project.status) }}</span>
        </div>
        <div class="pd-title-right" *ngIf="canArchive && project.status !== 'ARCHIVED'">
          <button class="archive-btn" (click)="archiveProject()" type="button">Archive</button>
        </div>
      </div>

      <!-- Tab bar + actions -->
      <div class="pd-tab-bar">
        <div class="pd-tabs">
          <button *ngFor="let t of tabs" class="pd-tab"
            [class.active]="activeTab === t.key"
            (click)="activeTab = t.key" type="button">{{ t.label }}</button>
        </div>
        <div class="pd-tab-actions" *ngIf="activeTab === 'board'">
          <button type="button" class="tab-action-btn">⊞ Filter</button>
          <button type="button" class="tab-action-btn">↕ Sort</button>
          <button type="button" class="tab-action-btn">⊟ Group</button>
          <button type="button" class="tab-action-btn icon-btn">···</button>
        </div>
      </div>

      <!-- Content -->
      <div class="pd-content">
        <app-task-board *ngIf="activeTab === 'board'" [projectId]="project.id"></app-task-board>
        <app-project-analytics *ngIf="activeTab === 'analytics'" [projectId]="project.id"></app-project-analytics>
        <app-project-settings *ngIf="activeTab === 'settings'" [project]="project" (updated)="project = $event"></app-project-settings>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .pd {
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 16px 24px 0;
      background: var(--bg-base);
      color: var(--text-primary);
      overflow: hidden;
    }

    /* Skeleton */
    .pd-skeleton { display: flex; flex-direction: column; gap: 12px; padding: 20px 0; }
    .sk { background: var(--bg-elevated); border-radius: 4px; animation: shimmer 1.5s ease-in-out infinite alternate; }
    .sk-bar { height: 20px; }
    .w40 { width: 40%; }
    .w60 { width: 60%; }
    .sk-board { height: 400px; border-radius: 8px; }
    @keyframes shimmer { from { opacity: 0.4; } to { opacity: 0.8; } }

    /* Error */
    .pd-error { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
    .err-icon { font-size: 32px; color: var(--danger); }
    .pd-error p { font-size: 15px; }
    .pd-error button {
      height: 32px; padding: 0 16px; border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md); background: transparent; color: var(--text-secondary);
      cursor: pointer; font-size: 13px;
    }
    .pd-error button:hover { border-color: var(--accent); color: var(--accent); }

    /* Breadcrumb */
    .pd-breadcrumb {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: var(--text-tertiary);
      margin-bottom: 6px;
    }
    .crumb.link { cursor: pointer; transition: color 0.15s; }
    .crumb.link:hover { color: var(--text-secondary); }
    .crumb.current { color: var(--text-secondary); }
    .sep { font-size: 14px; }

    /* Title row */
    .pd-title-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px; margin-bottom: 12px;
    }
    .pd-title-left { display: flex; align-items: center; gap: 12px; min-width: 0; }

    h1 {
      font-size: 22px; font-weight: 700; cursor: pointer;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      transition: color 0.15s; margin: 0;
    }
    h1:hover { color: var(--accent); }

    .title-edit {
      font-size: 22px; font-weight: 700; background: none; border: none;
      border-bottom: 2px solid var(--accent); color: var(--text-primary);
      outline: none; width: 320px;
    }

    .pd-status {
      font-size: 11px; font-weight: 600; padding: 2px 10px;
      border-radius: var(--radius-full); border: 1px solid currentColor;
      text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; flex-shrink: 0;
    }
    .pd-status.planning   { color: var(--info); }
    .pd-status.active     { color: var(--success); }
    .pd-status.on-hold    { color: var(--warning); }
    .pd-status.completed  { color: var(--accent); }
    .pd-status.archived   { color: var(--text-tertiary); }

    .archive-btn {
      height: 30px; padding: 0 14px; font-size: 12px;
      border: 1px solid var(--danger); border-radius: var(--radius-md);
      background: transparent; color: var(--danger); cursor: pointer;
      transition: background 0.15s;
    }
    .archive-btn:hover { background: var(--danger-dim); }

    /* Tab bar */
    .pd-tab-bar {
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 0; flex-shrink: 0;
    }
    .pd-tabs { display: flex; gap: 0; }
    .pd-tab {
      height: 38px; padding: 0 16px; border: none; background: transparent;
      color: var(--text-secondary); font-size: 13px; font-weight: 500;
      border-bottom: 2px solid transparent; margin-bottom: -1px;
      cursor: pointer; transition: color 0.15s, border-color 0.15s;
    }
    .pd-tab:hover { color: var(--text-primary); }
    .pd-tab.active { color: var(--text-primary); border-bottom-color: var(--accent); }

    .pd-tab-actions { display: flex; align-items: center; gap: 6px; }
    .tab-action-btn {
      height: 28px; padding: 0 10px; border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md); background: transparent;
      color: var(--text-secondary); font-size: 12px; cursor: pointer;
      transition: all 0.15s; display: inline-flex; align-items: center; gap: 4px;
    }
    .tab-action-btn:hover { border-color: var(--border-default); color: var(--text-primary); }
    .icon-btn { padding: 0 8px; letter-spacing: 2px; }

    /* Content — fill remaining space */
    .pd-content {
      flex: 1; min-height: 0; overflow: auto;
      padding-top: 16px; padding-bottom: 16px;
    }
  `]
})
export default class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);
  readonly router = inject(Router);
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

  statusLabel(status: ProjectStatus): string {
    return status.replace('_', ' ');
  }
}
