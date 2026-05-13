import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../../api/project.service';
import { Project, ProjectStatus } from '../../../shared/models/project.model';
import { AuthStore } from '../../../store/auth.store';
import { ProjectAnalyticsComponent } from '../project-analytics/project-analytics.component';
import { ProjectSettingsComponent } from '../project-settings/project-settings.component';
import TaskBoardComponent, { TaskBoardFilters, TaskBoardGroup, TaskBoardSort } from '../../task/task-board/task-board.component';

type Tab = 'board' | 'analytics' | 'settings';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectAnalyticsComponent, ProjectSettingsComponent, TaskBoardComponent],
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
        <span class="crumb link">Acme Inc. / {{ project.workspace?.name || 'Workspace' }}</span>
        <span class="sep">›</span>
      </div>

      <!-- Title row -->
      <div class="pd-title-row">
        <div class="pd-title-left">
          <h1 *ngIf="!isEditingTitle" (click)="isEditingTitle = true">{{ project.title }}</h1>
          <span class="chevron-down" *ngIf="!isEditingTitle">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </span>
          <button
            class="star-icon"
            type="button"
            *ngIf="!isEditingTitle"
            [class.active]="project.favorite"
            [attr.aria-label]="favoriteLabel"
            [disabled]="isTogglingFavorite"
            (click)="toggleFavorite($event)">
            {{ project.favorite ? '★' : '☆' }}
          </button>
          <input *ngIf="isEditingTitle" class="title-edit" [value]="project.title"
            (blur)="onTitleBlur($event)" (keydown.enter)="$any($event.target).blur()" autofocus />
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
          <button type="button" class="tab-action-btn" [class.active]="openBoardPanel === 'filter'" (click)="toggleBoardPanel('filter')">Filter</button>
          <button type="button" class="tab-action-btn" [class.active]="openBoardPanel === 'sort'" (click)="toggleBoardPanel('sort')">Sort</button>
          <button type="button" class="tab-action-btn" (click)="toggleBoardGroup()">Group: {{ boardGroupMode === 'status' ? 'Status' : 'Priority' }}</button>
          <button type="button" class="tab-action-btn icon-btn" [class.active]="openBoardPanel === 'more'" (click)="toggleBoardPanel('more')">...</button>
        </div>
      </div>

      <div class="pd-board-panel" *ngIf="activeTab === 'board' && openBoardPanel === 'filter'">
        <label>
          <span>Search</span>
          <input type="text" placeholder="Search tasks..." [ngModel]="boardFilters.keyword || ''" (ngModelChange)="setBoardFilter('keyword', $event)" />
        </label>
        <label>
          <span>Priority</span>
          <select [ngModel]="boardFilters.priority || ''" (ngModelChange)="setBoardFilter('priority', $event)">
            <option value="">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </label>
        <label class="check-control">
          <input type="checkbox" [ngModel]="boardFilters.overdue || false" (ngModelChange)="setBoardFilter('overdue', $event)" />
          <span>Overdue only</span>
        </label>
        <button type="button" class="panel-link-btn" (click)="clearBoardControls()">Clear</button>
      </div>

      <div class="pd-board-panel compact" *ngIf="activeTab === 'board' && openBoardPanel === 'sort'">
        <label>
          <span>Sort tasks by</span>
          <select [ngModel]="boardSortMode" (ngModelChange)="setBoardSort($event)">
            <option value="updated">Recently updated</option>
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </select>
        </label>
      </div>

      <div class="pd-board-panel compact" *ngIf="activeTab === 'board' && openBoardPanel === 'more'">
        <button type="button" class="panel-link-btn" (click)="refreshBoard()">Refresh board</button>
        <button type="button" class="panel-link-btn" (click)="clearBoardControls()">Reset board view</button>
      </div>

      <!-- Content -->
      <div class="pd-content">
        <app-task-board
          *ngIf="activeTab === 'board'"
          [projectId]="project.id"
          [externalFilters]="boardFilters"
          [sortMode]="boardSortMode"
          [groupMode]="boardGroupMode"
          [refreshToken]="boardRefreshToken">
        </app-task-board>
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
      position: relative;
      z-index: 1;
    }

    /* Background glow/lightning effect */
    .pd::before {
      content: '';
      position: absolute;
      top: -400px;
      left: 50%;
      transform: translateX(-50%);
      width: 1400px;
      height: 900px;
      background: radial-gradient(circle, rgba(162, 116, 68, 0.18) 0%, rgba(0, 0, 0, 0) 65%);
      pointer-events: none;
      z-index: -1;
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
      font-size: 24px; font-weight: 500; cursor: pointer;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      transition: color 0.15s; margin: 0; color: #fff;
    }
    h1:hover { color: #ccc; }

    .chevron-down {
      display: inline-flex; align-items: center; color: var(--text-tertiary);
      margin-left: 4px; cursor: pointer;
    }
    .star-icon {
      width: 28px;
      height: 28px;
      border: 1px solid transparent;
      border-radius: var(--radius-full);
      background: transparent;
      color: var(--text-tertiary);
      font-size: 16px;
      margin-left: 4px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .star-icon:hover,
    .star-icon.active {
      border-color: rgba(212,168,83,0.28);
      background: var(--accent-dim);
      color: var(--accent);
    }

    .title-edit {
      font-size: 24px; font-weight: 500; background: none; border: none;
      border-bottom: 2px solid var(--accent); color: var(--text-primary);
      outline: none; width: 320px;
    }

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
    .tab-action-btn.active {
      border-color: rgba(212,168,83,0.35);
      background: var(--accent-dim);
      color: var(--accent);
    }
    .icon-btn { padding: 0 8px; letter-spacing: 2px; }

    .pd-board-panel {
      min-height: 58px;
      margin-top: 10px;
      padding: 10px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      background: rgba(255,255,255,0.025);
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .pd-board-panel.compact {
      width: max-content;
      max-width: 100%;
    }

    .pd-board-panel label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);
      font-size: 12px;
    }

    .pd-board-panel input[type='text'],
    .pd-board-panel select {
      height: 32px;
      min-width: 150px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      color: var(--text-primary);
      padding: 0 10px;
      outline: none;
    }

    .check-control input {
      accent-color: var(--accent);
    }

    .panel-link-btn {
      height: 32px;
      padding: 0 12px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--accent);
      font-size: 12px;
      font-weight: 700;
    }

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
  isTogglingFavorite = false;
  activeTab: Tab = 'board';
  openBoardPanel: 'filter' | 'sort' | 'more' | null = null;
  boardFilters: TaskBoardFilters = {};
  boardSortMode: TaskBoardSort = 'updated';
  boardGroupMode: TaskBoardGroup = 'status';
  boardRefreshToken = 0;

  readonly tabs = [
    { key: 'board' as Tab, label: 'Board' },
    { key: 'analytics' as Tab, label: 'Analytics' },
    { key: 'settings' as Tab, label: 'Settings' },
  ];

  get canArchive(): boolean {
    const role = this.authStore.getUser()?.role;
    return role === 'ADMIN' || role === 'PROJECT_MANAGER';
  }

  get favoriteLabel(): string {
    return this.project?.favorite ? 'Remove project from favorites' : 'Add project to favorites';
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

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    if (!this.project || this.isTogglingFavorite) return;

    this.isTogglingFavorite = true;
    this.projectService.toggleFavorite(this.project.id).subscribe({
      next: (updated) => {
        this.project = { ...this.project!, favorite: updated.favorite };
        this.isTogglingFavorite = false;
      },
      error: () => {
        this.isTogglingFavorite = false;
      },
    });
  }

  toggleBoardPanel(panel: 'filter' | 'sort' | 'more'): void {
    this.openBoardPanel = this.openBoardPanel === panel ? null : panel;
  }

  setBoardFilter(key: keyof TaskBoardFilters, value: string | boolean): void {
    if (key === 'overdue') {
      this.boardFilters = { ...this.boardFilters, overdue: Boolean(value) || undefined };
      return;
    }
    if (key === 'priority') {
      this.boardFilters = { ...this.boardFilters, priority: (value || undefined) as TaskBoardFilters['priority'] };
      return;
    }
    this.boardFilters = { ...this.boardFilters, keyword: String(value || '').trim() || undefined };
  }

  setBoardSort(value: TaskBoardSort): void {
    this.boardSortMode = value;
  }

  toggleBoardGroup(): void {
    this.boardGroupMode = this.boardGroupMode === 'status' ? 'priority' : 'status';
  }

  refreshBoard(): void {
    this.boardRefreshToken += 1;
    this.openBoardPanel = null;
  }

  clearBoardControls(): void {
    this.boardFilters = {};
    this.boardSortMode = 'updated';
    this.boardGroupMode = 'status';
    this.boardRefreshToken += 1;
    this.openBoardPanel = null;
  }

  statusLabel(status: ProjectStatus): string {
    return status.replace('_', ' ');
  }
}
