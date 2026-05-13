import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, forkJoin, of, switchMap, takeUntil, finalize } from 'rxjs';
import { ProjectService } from '../../../api/project.service';
import { WorkspaceService } from '../../../api/workspace.service';
import { WorkspaceContextService } from '../../../core/services/workspace-context.service';
import { Project, ProjectStatus } from '../../../shared/models/project.model';
import { Workspace } from '../../../shared/models/workspace.model';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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
          <button class="new-project-btn" type="button" (click)="openCreateModal()">
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
        <button class="new-project-btn empty-create-btn" type="button" (click)="openCreateModal()">Create project</button>
      </section>
      <div class="modal-overlay" *ngIf="isCreateOpen" (click)="closeCreateModal()">
        <div class="modal-box project-create-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span>New project</span>
              <h2>Create a project</h2>
            </div>
            <button class="modal-close" type="button" aria-label="Close" (click)="closeCreateModal()">x</button>
          </div>

          <form [formGroup]="createProjectForm" (ngSubmit)="createProject()" class="modal-form">
            <div class="field-group">
              <label for="project-workspace">Workspace</label>
              <select id="project-workspace" formControlName="workspaceId" (change)="onCreateWorkspaceChanged()">
                <option value="" disabled>Select workspace</option>
                <option *ngFor="let workspace of workspaces" [value]="workspace.id">{{ workspace.name }}</option>
              </select>
            </div>

            <div class="field-group">
              <label for="project-title">Project name</label>
              <input id="project-title" type="text" placeholder="e.g. Design system refresh" formControlName="title" />
              <small *ngIf="createProjectForm.controls.title.touched && createProjectForm.controls.title.invalid">Project name is required.</small>
            </div>

            <div class="field-group">
              <label for="project-description">Description</label>
              <textarea id="project-description" rows="3" placeholder="What is this project about?" formControlName="description"></textarea>
            </div>

            <div class="modal-grid">
              <div class="field-group">
                <label for="project-manager">Manager</label>
                <select id="project-manager" formControlName="managerId">
                  <option value="">No manager</option>
                  <option *ngFor="let member of selectedWorkspaceMembers" [value]="member.id">{{ member.username }}</option>
                </select>
              </div>

              <div class="field-group">
                <label for="project-deadline">Due date</label>
                <input id="project-deadline" type="date" formControlName="deadline" />
              </div>
            </div>

            <p class="modal-error" *ngIf="createError">{{ createError }}</p>

            <div class="modal-actions">
              <button class="cancel-btn" type="button" (click)="closeCreateModal()">Cancel</button>
              <button class="submit-btn" type="submit" [disabled]="createProjectForm.invalid || isCreating || !workspaces.length">
                {{ isCreating ? 'Creating...' : 'Create project' }}
              </button>
            </div>
          </form>
        </div>
      </div>
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
    .empty-create-btn { margin-top: 18px; }

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
export default class ProjectListComponent implements OnInit, OnDestroy {
  private readonly projectService = inject(ProjectService);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  projects: Project[] = [];
  filtered: Project[] = [];
  workspaces: Workspace[] = [];
  loading = true;
  isCreateOpen = false;
  isCreating = false;
  createError = '';
  currentWorkspaceId: string | null = null;
  activeFilter: string = 'ALL';
  searchText = '';

  readonly createProjectForm = this.fb.nonNullable.group({
    workspaceId: ['', Validators.required],
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
    deadline: [''],
    managerId: [''],
  });

  readonly filters = [
    { label: 'All', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Planning', value: 'PLANNING' },
    { label: 'On Hold', value: 'ON_HOLD' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Archived', value: 'ARCHIVED' },
  ];

  ngOnInit(): void {
    this.loadWorkspaceOptions();

    this.workspaceContext.selectedWorkspaceId$
      .pipe(
        switchMap((workspaceId) => {
          this.currentWorkspaceId = workspaceId;
          this.loading = true;
          if (workspaceId) return this.projectService.getByWorkspace(workspaceId);
          return this.loadAllWorkspaceProjects();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (projects) => {
          this.projects = projects;
          this.applyFilter();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  private loadWorkspaceOptions(): void {
    this.workspaceService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workspaces) => {
          this.workspaces = workspaces;
          const selected = this.workspaceContext.syncAvailableWorkspaces(workspaces);
          const workspaceId = selected?.id || workspaces[0]?.id || '';
          this.createProjectForm.patchValue({
            workspaceId,
            managerId: this.defaultManagerId(workspaceId),
          });
        },
        error: () => {
          this.workspaces = [];
        },
      });
  }

  private loadAllWorkspaceProjects() {
    return this.workspaceService.getAll().pipe(
      switchMap(workspaces => {
        const selected = this.workspaceContext.syncAvailableWorkspaces(workspaces);
        if (selected) return this.projectService.getByWorkspace(selected.id);
        if (!workspaces.length) return of([] as Project[]);
        return forkJoin(workspaces.map(ws => this.projectService.getByWorkspace(ws.id)))
          .pipe(switchMap((projectGroups) => of(projectGroups.flat())));
      })
    );
  }

  private refreshProjects(): void {
    this.loading = true;
    const source = this.currentWorkspaceId
      ? this.projectService.getByWorkspace(this.currentWorkspaceId)
      : this.loadAllWorkspaceProjects();

    source
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (projects) => {
          this.projects = projects;
          this.applyFilter();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  get selectedWorkspaceMembers(): User[] {
    const workspaceId = this.createProjectForm.controls.workspaceId.value;
    const workspace = this.workspaces.find((candidate) => candidate.id === workspaceId);
    if (!workspace) return [];

    const users = new Map<string, User>();
    if (workspace.owner) users.set(workspace.owner.id, workspace.owner);
    (workspace.members || []).forEach((member) => users.set(member.id, member));
    return Array.from(users.values());
  }

  openCreateModal(): void {
    const workspaceId = this.currentWorkspaceId || this.workspaceContext.selectedWorkspaceId || this.workspaces[0]?.id || '';
    this.createError = '';
    this.createProjectForm.reset({
      workspaceId,
      title: '',
      description: '',
      deadline: '',
      managerId: this.defaultManagerId(workspaceId),
    });
    this.isCreateOpen = true;
  }

  closeCreateModal(): void {
    if (this.isCreating) return;
    this.isCreateOpen = false;
    this.createError = '';
  }

  onCreateWorkspaceChanged(): void {
    const workspaceId = this.createProjectForm.controls.workspaceId.value;
    this.createProjectForm.patchValue({ managerId: this.defaultManagerId(workspaceId) });
  }

  createProject(): void {
    if (this.createProjectForm.invalid) {
      this.createProjectForm.markAllAsTouched();
      return;
    }

    const { workspaceId, title, description, deadline, managerId } = this.createProjectForm.getRawValue();
    this.isCreating = true;
    this.createError = '';

    this.projectService.create(workspaceId, {
      title,
      description: description || '',
      deadline: deadline || undefined,
      managerId: managerId || undefined,
    })
      .pipe(finalize(() => (this.isCreating = false)))
      .subscribe({
        next: () => {
          this.isCreateOpen = false;
          if (this.currentWorkspaceId !== workspaceId) {
            this.workspaceContext.selectWorkspace(workspaceId);
            return;
          }
          this.refreshProjects();
        },
        error: () => {
          this.createError = 'Project could not be created. Please check the fields and try again.';
        },
      });
  }

  private defaultManagerId(workspaceId: string): string {
    const workspace = this.workspaces.find((candidate) => candidate.id === workspaceId);
    if (!workspace) return '';
    return workspace.owner?.id || workspace.members?.[0]?.id || '';
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
