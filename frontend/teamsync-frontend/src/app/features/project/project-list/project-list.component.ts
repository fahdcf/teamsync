import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { ProjectService } from '../../../api/project.service';
import { WorkspaceService } from '../../../api/workspace.service';
import { Project, ProjectStatus } from '../../../shared/models/project.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="projects-page redesigned-projects-page">
      <header class="projects-header">
        <div>
          <div class="projects-title-row">
            <h1>Projects</h1>
            <span>{{ filtered.length }}</span>
          </div>
          <p>Track and manage workspace projects.</p>
        </div>

        <div class="projects-header-actions">
          <button class="new-project-btn" type="button">
            <span aria-hidden="true">+</span>
            New Project
          </button>
          <div class="project-view-toggle" aria-label="Project view toggle">
            <button type="button" aria-label="Grid view">▦</button>
            <button class="active" type="button" aria-label="List view">☰</button>
          </div>
        </div>
      </header>

      <section class="project-filter-panel">
        <div class="project-search-box">
          <span aria-hidden="true">⌕</span>
          <input type="text" placeholder="Search projects..." [(ngModel)]="searchText" (ngModelChange)="applyFilter()" />
        </div>

        <div class="project-status-tabs">
          <button
            *ngFor="let f of filters"
            class="filter-btn"
            [class.active]="activeFilter === f.value"
            (click)="setFilter(f.value)"
            type="button"
          >{{ f.label }}</button>
        </div>

        <div class="project-filter-row">
          <button type="button"><span aria-hidden="true">♙</span> Team: All <b>⌄</b></button>
          <button type="button"><span aria-hidden="true">□</span> Due date <b>⌄</b></button>
          <button type="button">Sort: Recent <b>⌄</b></button>
        </div>
      </section>

      <div class="loading-row" *ngIf="loading">
        <div class="spinner"></div>
        <span>Loading projects...</span>
      </div>

      <section class="project-table-card" *ngIf="!loading && filtered.length">
        <div class="project-table-head">
          <span>Project</span>
          <span>Progress</span>
          <span>Status</span>
          <span>Due date</span>
          <span>Team</span>
          <span>Tasks</span>
          <span>Activity</span>
          <span></span>
        </div>

        <article
          class="project-table-row"
          *ngFor="let project of filtered"
          (click)="open(project.id)"
          tabindex="0"
          (keydown.enter)="open(project.id)"
        >
          <div class="project-cell project-name-cell">
            <div class="project-name-line">
              <i class="project-dot" [class]="project.status.toLowerCase().replace('_','-')"></i>
              <strong>{{ project.title }}</strong>
            </div>
            <p>{{ project.description || 'No description provided.' }}</p>
          </div>

          <div class="project-cell project-progress-cell">
            <strong>{{ project.progress }}%</strong>
            <div class="project-progress-track"><i [style.width.%]="project.progress" [class]="progressClass(project.progress)"></i></div>
          </div>

          <div class="project-cell">
            <span class="project-status-pill" [class]="project.status.toLowerCase().replace('_','-')">
              {{ statusLabel(project.status) }}
            </span>
          </div>

          <div class="project-cell project-date-cell">
            <span aria-hidden="true">□</span>
            <strong>{{ project.deadline ? (project.deadline | date:'MMM d, y') : 'No deadline' }}</strong>
          </div>

          <div class="project-cell">
            <span class="project-avatar" *ngIf="project.manager">{{ initials(project.manager.username) }}</span>
            <span class="project-avatar" *ngIf="!project.manager">?</span>
          </div>

          <div class="project-cell project-task-cell">
            <strong>0</strong>
            <small>Tasks</small>
          </div>

          <div class="project-cell project-activity-cell">
            <i></i>
            <span>Just now</span>
          </div>

          <button class="project-more-btn" type="button" aria-label="Project options" (click)="$event.stopPropagation()">⋮</button>
        </article>

        <footer>Showing {{ filtered.length }} of {{ projects.length }} project{{ projects.length === 1 ? '' : 's' }}</footer>
      </section>

      <section class="project-empty-card" *ngIf="!loading && !filtered.length">
        <div class="empty-icon">▣</div>
        <h2>No projects found</h2>
        <p>{{ activeFilter !== 'ALL' || searchText ? 'Try a different filter or search.' : 'Create your first project to get started.' }}</p>
      </section>
    </div>
  `,
  styles: [`
    .redesigned-projects-page {
      min-height: 100%;
      padding: 34px 32px 64px;
      color: var(--text-primary);
      background:
        radial-gradient(ellipse 54% 28% at 62% 0%, rgba(180,130,60,0.08), transparent 72%),
        var(--bg-base);
    }

    .projects-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 24px;
    }

    .projects-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    h1 {
      margin: 0;
      font-size: 25px;
      line-height: 1;
      letter-spacing: -0.04em;
      font-weight: 760;
    }

    .projects-title-row span {
      min-width: 24px;
      height: 24px;
      padding: 0 8px;
      border-radius: var(--radius-full);
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }

    .projects-header p {
      margin: 12px 0 0;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .projects-header-actions,
    .project-view-toggle,
    .project-status-tabs,
    .project-filter-row {
      display: flex;
      align-items: center;
    }

    .projects-header-actions {
      gap: 14px;
    }

    .new-project-btn {
      height: 38px;
      padding: 0 18px;
      border: 1px solid rgba(245,190,88,0.45);
      border-radius: var(--radius-md);
      background: linear-gradient(180deg, #efc96e, #d7a748);
      color: #14100a;
      font-size: 13px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 26px rgba(212,168,83,0.14), inset 0 1px 0 rgba(255,255,255,0.32);
    }

    .new-project-btn span { font-size: 18px; }

    .project-view-toggle {
      height: 38px;
      padding: 3px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: rgba(255,255,255,0.025);
      gap: 2px;
    }

    .project-view-toggle button {
      width: 34px;
      height: 30px;
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-tertiary);
      font-size: 15px;
    }

    .project-view-toggle button.active {
      border: 1px solid rgba(212,168,83,0.28);
      background: var(--accent-dim);
      color: var(--accent);
    }

    .project-filter-panel,
    .project-table-card,
    .project-empty-card {
      border: 1px solid var(--border-default);
      border-radius: var(--radius-xl);
      background: linear-gradient(145deg, rgba(255,255,255,0.032), rgba(255,255,255,0.01)), var(--bg-surface);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
    }

    .project-filter-panel {
      min-height: 124px;
      padding: 20px;
      margin-bottom: 18px;
      display: flex;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 18px;
    }

    .project-search-box {
      width: 230px;
      height: 38px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: rgba(255,255,255,0.022);
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 12px;
      color: var(--text-tertiary);
    }

    .project-search-box input {
      width: 100%;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--text-primary);
      font-size: 13px;
    }

    .project-search-box input::placeholder { color: var(--text-tertiary); }

    .project-status-tabs {
      height: 38px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: rgba(255,255,255,0.018);
      padding: 3px;
      gap: 2px;
    }

    .filter-btn {
      height: 30px;
      padding: 0 14px;
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-secondary);
      font-size: 12px;
    }

    .filter-btn.active {
      background: rgba(212,168,83,0.14);
      border: 1px solid rgba(212,168,83,0.28);
      color: var(--text-primary);
    }

    .project-filter-row {
      flex-basis: 100%;
      gap: 12px;
    }

    .project-filter-row button {
      height: 38px;
      min-width: 132px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: rgba(255,255,255,0.022);
      color: var(--text-primary);
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 13px;
      padding: 0 14px;
    }

    .project-filter-row button span,
    .project-filter-row button b { color: var(--text-secondary); font-weight: 500; }

    .loading-row {
      min-height: 240px;
      display: grid;
      place-items: center;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .spinner { display: none; }

    .project-table-card {
      overflow: hidden;
    }

    .project-table-head,
    .project-table-row {
      display: grid;
      grid-template-columns: minmax(190px, 1.55fr) 130px 110px 150px 82px 82px 118px 36px;
      align-items: center;
      gap: 18px;
    }

    .project-table-head {
      min-height: 56px;
      padding: 0 28px;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 600;
    }

    .project-table-row {
      min-height: 104px;
      padding: 18px 28px;
      cursor: pointer;
      border-bottom: 1px solid var(--border-subtle);
      transition: background 0.15s, border-color 0.15s;
    }

    .project-table-row:hover {
      background: rgba(255,255,255,0.024);
    }

    .project-cell { min-width: 0; }

    .project-name-line {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }

    .project-dot,
    .project-activity-cell i {
      width: 7px;
      height: 7px;
      border-radius: var(--radius-full);
      background: var(--info);
      flex: 0 0 auto;
    }

    .project-dot.active { background: var(--success); }
    .project-dot.planning { background: var(--info); }
    .project-dot.on-hold { background: var(--warning); }
    .project-dot.completed { background: var(--accent); }
    .project-dot.archived { background: var(--text-tertiary); }

    .project-name-line strong {
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 700;
    }

    .project-name-cell p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .project-progress-cell strong,
    .project-task-cell strong {
      display: block;
      margin-bottom: 8px;
      color: var(--text-primary);
      font-size: 14px;
    }

    .project-progress-track {
      width: 104px;
      height: 5px;
      border-radius: var(--radius-full);
      background: var(--bg-elevated);
      overflow: hidden;
    }

    .project-progress-track i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--success);
    }

    .project-progress-track i.low { background: var(--border-default); }
    .project-progress-track i.mid { background: var(--warning); }
    .project-progress-track i.high { background: var(--success); }
    .project-progress-track i.done { background: var(--accent); }

    .project-status-pill {
      height: 28px;
      padding: 0 12px;
      border-radius: var(--radius-full);
      display: inline-flex;
      align-items: center;
      background: rgba(96,165,250,0.14);
      color: var(--info);
      font-size: 13px;
      text-transform: capitalize;
    }

    .project-status-pill.active { background: var(--success-dim); color: var(--success); }
    .project-status-pill.on-hold { background: var(--warning-dim); color: var(--warning); }
    .project-status-pill.completed { background: var(--accent-dim); color: var(--accent); }
    .project-status-pill.archived { background: var(--bg-elevated); color: var(--text-secondary); }

    .project-date-cell,
    .project-activity-cell {
      display: flex;
      align-items: center;
      gap: 9px;
      color: var(--text-secondary);
      font-size: 13px;
    }

    .project-date-cell strong { color: var(--text-primary); font-size: 13px; }

    .project-avatar {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, #d6a56f, #506174 70%, #1b2528);
      border: 1px solid var(--border-default);
      color: #fff;
      display: grid;
      place-items: center;
      font-size: 12px;
      font-weight: 800;
    }

    .project-task-cell small {
      color: var(--text-secondary);
      font-size: 12px;
    }

    .project-activity-cell i { background: var(--success); }

    .project-more-btn {
      width: 30px;
      height: 30px;
      border: 0;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-tertiary);
      font-size: 18px;
    }

    .project-more-btn:hover {
      background: var(--bg-elevated);
      color: var(--text-primary);
    }

    .project-table-card footer {
      min-height: 54px;
      display: grid;
      place-items: center;
      color: var(--text-tertiary);
      font-size: 12px;
    }

    .project-empty-card {
      min-height: 260px;
      display: grid;
      place-items: center;
      text-align: center;
      color: var(--text-secondary);
    }

    .project-empty-card h2 { margin: 8px 0; font-size: 18px; color: var(--text-primary); }
    .project-empty-card p { margin: 0; }
    .empty-icon { color: var(--text-tertiary); font-size: 34px; }

    @media (max-width: 1100px) {
      .project-table-card { overflow-x: auto; }
      .project-table-head,
      .project-table-row { min-width: 960px; }
    }

    @media (max-width: 760px) {
      .redesigned-projects-page { padding: 24px 18px 48px; }
      .projects-header { flex-direction: column; }
      .project-filter-panel { align-items: stretch; }
      .project-search-box { width: 100%; }
      .project-status-tabs { overflow-x: auto; }
      .project-filter-row { flex-direction: column; align-items: stretch; }
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
  searchText = '';

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
    const search = this.searchText.trim().toLowerCase();
    this.filtered = this.projects.filter(project => {
      const matchesStatus = this.activeFilter === 'ALL' || project.status === this.activeFilter;
      const matchesSearch = !search || project.title.toLowerCase().includes(search) || (project.description || '').toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }

  open(id: string): void {
    this.router.navigate(['/projects', id]);
  }

  statusLabel(status: ProjectStatus): string {
    return status.replace('_', ' ').toLowerCase();
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
