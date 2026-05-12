import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { ProjectService } from '../../../api/project.service';
import { WorkspaceService } from '../../../api/workspace.service';
import { Project, ProjectStatus } from '../../../shared/models/project.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="projects-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1>Projects</h1>
          <span class="count-badge">{{ filtered.length }}</span>
        </div>
        <div class="header-actions">
          <div class="filter-group">
            <button
              *ngFor="let f of filters"
              class="filter-btn"
              [class.active]="activeFilter === f.value"
              (click)="setFilter(f.value)"
              type="button"
            >{{ f.label }}</button>
          </div>
        </div>
      </header>

      <!-- Loading -->
      <div class="loading-row" *ngIf="loading">
        <div class="spinner"></div>
        <span>Loading projects…</span>
      </div>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!loading && !filtered.length">
        <div class="empty-icon">▣</div>
        <p>No projects found</p>
        <span>{{ activeFilter !== 'ALL' ? 'Try a different filter.' : 'Create your first project to get started.' }}</span>
      </div>

      <!-- Grid -->
      <div class="projects-grid" *ngIf="!loading && filtered.length">
        <article
          class="project-card"
          *ngFor="let project of filtered"
          (click)="open(project.id)"
          tabindex="0"
          (keydown.enter)="open(project.id)"
        >
          <div class="card-top">
            <div class="card-title-row">
              <span class="status-dot" [class]="project.status.toLowerCase().replace('_','-')"></span>
              <h2>{{ project.title }}</h2>
            </div>
            <span class="status-badge" [class]="project.status.toLowerCase().replace('_','-')">
              {{ statusLabel(project.status) }}
            </span>
          </div>

          <p class="card-desc">{{ project.description || 'No description provided.' }}</p>

          <div class="progress-section">
            <div class="progress-labels">
              <span>Progress</span>
              <span class="progress-pct">{{ project.progress }}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" [style.width.%]="project.progress" [class]="progressClass(project.progress)"></div>
            </div>
          </div>

          <div class="card-meta">
            <div class="meta-item">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M4 1.5v3M12 1.5v3M2 7h12"/></svg>
              <span>{{ project.deadline ? (project.deadline | date:'MMM d, y') : 'No deadline' }}</span>
            </div>
            <div class="meta-item workspace-tag">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
              <span>{{ project.workspace?.name || 'Workspace' }}</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="manager-row" *ngIf="project.manager">
              <div class="manager-avatar">{{ initials(project.manager.username) }}</div>
              <span class="manager-name">{{ project.manager.username }}</span>
            </div>
            <button class="open-btn" type="button" (click)="$event.stopPropagation(); open(project.id)">
              Open →
            </button>
          </div>
        </article>
      </div>
    </div>
  `,
  styles: [`
    .projects-page {
      min-height: 100%;
      padding: 32px;
      background: var(--bg-base);
      color: var(--text-primary);
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    h1 {
      font-size: 24px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .count-badge {
      height: 22px;
      padding: 0 8px;
      border-radius: var(--radius-full);
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      font-size: 12px;
      color: var(--text-secondary);
      display: inline-flex;
      align-items: center;
    }

    .filter-group {
      display: flex;
      gap: 4px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 3px;
    }

    .filter-btn {
      height: 28px;
      padding: 0 12px;
      border-radius: var(--radius-md);
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }

    .filter-btn.active {
      background: var(--bg-elevated);
      color: var(--text-primary);
    }

    .filter-btn:hover:not(.active) {
      color: var(--text-primary);
    }

    /* Loading */
    .loading-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 48px 0;
      justify-content: center;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--border-default);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Empty */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 80px 0;
      color: var(--text-secondary);
    }

    .empty-icon {
      font-size: 40px;
      opacity: 0.3;
      margin-bottom: 8px;
    }

    .empty-state p {
      font-size: 16px;
      color: var(--text-primary);
    }

    .empty-state span {
      font-size: 13px;
    }

    /* Grid */
    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .project-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
    }

    .project-card:hover {
      border-color: var(--border-default);
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }

    .card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }

    .card-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    h2 {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Status colors */
    .status-dot.planning, .status-badge.planning { background: var(--info); color: var(--info); }
    .status-dot.active, .status-badge.active { background: var(--success); color: var(--success); }
    .status-dot.on-hold, .status-badge.on-hold { background: var(--warning); color: var(--warning); }
    .status-dot.completed, .status-badge.completed { background: var(--accent); color: var(--accent); }
    .status-dot.archived, .status-badge.archived { background: var(--text-tertiary); color: var(--text-tertiary); }

    .status-badge {
      font-size: 11px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: transparent;
      border: 1px solid currentColor;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .card-desc {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .progress-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .progress-pct {
      color: var(--text-primary);
      font-weight: 500;
    }

    .progress-track {
      height: 4px;
      background: var(--bg-elevated);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: inherit;
      transition: width 0.4s ease;
    }

    .progress-fill.low { background: var(--danger); }
    .progress-fill.mid { background: var(--warning); }
    .progress-fill.high { background: var(--success); }
    .progress-fill.done { background: var(--accent); }

    .card-meta {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: var(--text-tertiary);
    }

    .workspace-tag {
      color: var(--text-secondary);
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 8px;
      border-top: 1px solid var(--border-subtle);
    }

    .manager-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .manager-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #c18c60, #2f5874);
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .manager-name {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .open-btn {
      height: 28px;
      padding: 0 12px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--accent);
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .open-btn:hover {
      background: var(--accent-dim);
      border-color: var(--accent);
    }
  `]
})
export default class ProjectListComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly router = inject(Router);

  projects: Project[] = [];
  filtered: Project[] = [];
  loading = true;
  activeFilter: string = 'ALL';

  readonly filters = [
    { label: 'All', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Planning', value: 'PLANNING' },
    { label: 'On Hold', value: 'ON_HOLD' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Archived', value: 'ARCHIVED' },
  ];

  ngOnInit(): void {
    this.workspaceService.getAll().pipe(
      switchMap(workspaces => {
        if (!workspaces.length) return of([] as Project[]);
        return forkJoin(workspaces.map(ws => this.projectService.getByWorkspace(ws.id)));
      })
    ).subscribe({
      next: (results) => {
        this.projects = Array.isArray(results[0]) ? (results as Project[][]).flat() : results as unknown as Project[];
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  setFilter(value: string): void {
    this.activeFilter = value;
    this.applyFilter();
  }

  applyFilter(): void {
    this.filtered = this.activeFilter === 'ALL'
      ? this.projects
      : this.projects.filter(p => p.status === this.activeFilter);
  }

  open(id: string): void {
    this.router.navigate(['/projects', id]);
  }

  statusLabel(status: ProjectStatus): string {
    return status.replace('_', ' ');
  }

  progressClass(progress: number): string {
    if (progress >= 100) return 'done';
    if (progress >= 60) return 'high';
    if (progress >= 30) return 'mid';
    return 'low';
  }

  initials(name: string): string {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }
}
