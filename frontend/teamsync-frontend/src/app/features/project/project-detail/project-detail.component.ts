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
    <!-- Loading skeleton -->
    <div class="project-page" *ngIf="isLoading">
      <div class="skeleton-header">
        <div class="sk sk-title"></div>
        <div class="sk sk-meta"></div>
      </div>
      <div class="sk sk-tabs"></div>
      <div class="sk sk-board"></div>
    </div>

    <!-- Error -->
    <div class="project-page error-page" *ngIf="!isLoading && hasError">
      <div class="error-state">
        <div class="error-icon">⚠</div>
        <p>Failed to load project</p>
        <button class="retry-btn" (click)="load()" type="button">Try again</button>
      </div>
    </div>

    <!-- Project detail -->
    <div class="project-page" *ngIf="!isLoading && !hasError && project">

      <!-- Hero header -->
      <div class="project-hero">
        <div class="hero-left">
          <div class="breadcrumb-row">
            <span class="crumb" (click)="router.navigate(['/workspaces'])" tabindex="0">Workspaces</span>
            <span class="crumb-sep">›</span>
            <span class="crumb current">{{ project.workspace?.name || 'Project' }}</span>
          </div>

          <div class="title-row">
            <h1 *ngIf="!isEditingTitle" (click)="isEditingTitle = true" class="project-title" title="Click to edit">
              {{ project.title }}
            </h1>
            <input *ngIf="isEditingTitle"
              class="title-input"
              [value]="project.title"
              (blur)="onTitleBlur($event)"
              autofocus />
          </div>

          <div class="meta-row">
            <span class="status-chip" [class]="project.status.toLowerCase().replace('_','-')">
              {{ statusLabel(project.status) }}
            </span>
            <span class="deadline-chip" [class.overdue]="isOverdue">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M4 1.5v3M12 1.5v3M2 7h12"/></svg>
              {{ project.deadline ? (project.deadline | date:'MMM d, y') : 'No deadline' }}
              <span *ngIf="!isOverdue && daysLeft > 0"> · {{ daysLeft }}d left</span>
              <span *ngIf="isOverdue"> · Overdue</span>
            </span>
            <span class="manager-chip" *ngIf="project.manager">
              <div class="mini-avatar">{{ initials(project.manager.username) }}</div>
              {{ project.manager.username }}
            </span>
          </div>
        </div>

        <div class="hero-right">
          <!-- Progress ring -->
          <div class="progress-widget">
            <svg class="progress-ring" viewBox="0 0 80 80">
              <circle class="ring-track" cx="40" cy="40" r="28"/>
              <circle class="ring-fill" cx="40" cy="40" r="28"
                [attr.stroke-dasharray]="progressDash" />
            </svg>
            <div class="progress-label">
              <span class="progress-pct">{{ project.progress }}%</span>
              <span class="progress-sub">done</span>
            </div>
          </div>

          <button *ngIf="canArchive && project.status !== 'ARCHIVED'"
            class="archive-btn" (click)="archiveProject()" type="button">
            Archive
          </button>
        </div>
      </div>

      <!-- Tab navigation -->
      <div class="tab-nav">
        <button *ngFor="let t of tabs"
          class="tab-btn"
          [class.active]="activeTab === t.key"
          (click)="activeTab = t.key"
          type="button">
          <span class="tab-icon">{{ t.icon }}</span>
          {{ t.label }}
        </button>
      </div>

      <!-- Tab content -->
      <div class="tab-body">
        <app-task-board *ngIf="activeTab === 'board'" [projectId]="project.id"></app-task-board>
        <app-project-analytics *ngIf="activeTab === 'analytics'" [projectId]="project.id"></app-project-analytics>
        <app-project-settings *ngIf="activeTab === 'settings'" [project]="project" (updated)="project = $event"></app-project-settings>
      </div>
    </div>
  `,
  styles: [`
    .project-page {
      min-height: 100%;
      padding: 28px 32px 32px;
      background: var(--bg-base);
      color: var(--text-primary);
    }

    /* Skeleton */
    .skeleton-header { margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; }
    .sk { background: var(--bg-elevated); border-radius: 6px; animation: shimmer 1.5s ease-in-out infinite alternate; }
    .sk-title { height: 32px; width: 40%; }
    .sk-meta { height: 18px; width: 60%; }
    .sk-tabs { height: 40px; margin-bottom: 20px; }
    .sk-board { height: 400px; }
    @keyframes shimmer { from { opacity: 0.5; } to { opacity: 1; } }

    /* Error */
    .error-page { display: flex; align-items: center; justify-content: center; }
    .error-state { display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--text-secondary); }
    .error-icon { font-size: 36px; color: var(--danger); }
    .error-state p { font-size: 15px; color: var(--text-primary); }
    .retry-btn {
      height: 32px; padding: 0 16px;
      border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
      background: transparent; color: var(--text-secondary);
      font-size: 13px; cursor: pointer; transition: all 0.15s;
    }
    .retry-btn:hover { border-color: var(--accent); color: var(--accent); }

    /* Hero */
    .project-hero {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .hero-left { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }

    .breadcrumb-row { display: flex; align-items: center; gap: 6px; }
    .crumb { font-size: 12px; color: var(--text-tertiary); cursor: pointer; transition: color 0.15s; }
    .crumb:hover { color: var(--text-secondary); }
    .crumb.current { color: var(--text-secondary); cursor: default; }
    .crumb-sep { color: var(--text-tertiary); font-size: 14px; }

    .title-row { display: flex; align-items: center; }
    .project-title {
      font-size: 26px; font-weight: 700; cursor: pointer;
      transition: color 0.15s;
    }
    .project-title:hover { color: var(--accent); }
    .title-input {
      background: none; border: none;
      border-bottom: 2px solid var(--accent);
      color: var(--text-primary);
      font-size: 26px; font-weight: 700;
      outline: none; width: 100%;
    }

    .meta-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    /* Status chip */
    .status-chip {
      font-size: 11px; font-weight: 600; padding: 3px 10px;
      border-radius: var(--radius-full);
      border: 1px solid currentColor;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .status-chip.planning { color: var(--info); }
    .status-chip.active { color: var(--success); }
    .status-chip.on-hold { color: var(--warning); }
    .status-chip.completed { color: var(--accent); }
    .status-chip.archived { color: var(--text-tertiary); }

    .deadline-chip {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 12px; color: var(--text-secondary);
    }
    .deadline-chip.overdue { color: var(--danger); }

    .manager-chip {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12px; color: var(--text-secondary);
    }
    .mini-avatar {
      width: 20px; height: 20px; border-radius: 50%;
      background: linear-gradient(135deg, #c18c60, #2f5874);
      color: #fff; font-size: 8px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }

    /* Hero right */
    .hero-right { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }

    .progress-widget { position: relative; width: 72px; height: 72px; }
    .progress-ring { width: 72px; height: 72px; transform: rotate(-90deg); }
    .ring-track { fill: none; stroke: var(--bg-elevated); stroke-width: 8; }
    .ring-fill { fill: none; stroke: var(--accent); stroke-width: 8; stroke-linecap: round; transition: stroke-dasharray 0.4s ease; }
    .progress-label {
      position: absolute; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 1px;
    }
    .progress-pct { font-size: 14px; font-weight: 700; color: var(--text-primary); line-height: 1; }
    .progress-sub { font-size: 9px; color: var(--text-tertiary); }

    .archive-btn {
      height: 32px; padding: 0 14px;
      border: 1px solid var(--danger);
      border-radius: var(--radius-md);
      background: transparent; color: var(--danger);
      font-size: 12px; cursor: pointer; transition: all 0.15s;
    }
    .archive-btn:hover { background: var(--danger-dim); }

    /* Tabs */
    .tab-nav {
      display: flex; gap: 4px;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 24px;
    }
    .tab-btn {
      height: 40px; padding: 0 16px;
      border: none; background: transparent;
      color: var(--text-secondary);
      font-size: 13px; font-weight: 500;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px; cursor: pointer;
      display: inline-flex; align-items: center; gap: 7px;
      transition: color 0.15s, border-color 0.15s;
    }
    .tab-btn:hover { color: var(--text-primary); }
    .tab-btn.active { color: var(--text-primary); border-bottom-color: var(--accent); }
    .tab-icon { font-size: 14px; }

    .tab-body { flex: 1; }
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
    { key: 'board' as Tab, label: 'Board', icon: '📋' },
    { key: 'analytics' as Tab, label: 'Analytics', icon: '📊' },
    { key: 'settings' as Tab, label: 'Settings', icon: '⚙️' },
  ];

  get canArchive(): boolean {
    const role = this.authStore.getUser()?.role;
    return role === 'ADMIN' || role === 'PROJECT_MANAGER';
  }

  get isOverdue(): boolean {
    if (!this.project?.deadline) return false;
    return new Date(this.project.deadline) < new Date() && this.project.status !== 'COMPLETED';
  }

  get daysLeft(): number {
    if (!this.project?.deadline) return 0;
    return Math.ceil((new Date(this.project.deadline).getTime() - Date.now()) / 86400000);
  }

  get progressDash(): string {
    const pct = Math.max(0, Math.min(100, this.project?.progress ?? 0));
    const r = 28, circ = 2 * Math.PI * r;
    return `${(pct / 100) * circ} ${circ}`;
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

  initials(name: string): string {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }
}
