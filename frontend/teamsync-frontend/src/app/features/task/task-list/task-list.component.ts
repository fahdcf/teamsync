import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, forkJoin, Subject } from 'rxjs';
import { TaskService } from '../../../api/task.service';
import { ProjectService } from '../../../api/project.service';
import { WorkspaceService } from '../../../api/workspace.service';
import { Task, TaskStatus, TaskPriority } from '../../../shared/models/task.model';
import { Project } from '../../../shared/models/project.model';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tasks-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1>Tasks</h1>
          <span class="count-badge">{{ totalTasks }}</span>
        </div>
      </header>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <span>Search</span>
          <input
            type="search"
            placeholder="Search tasks..."
            [ngModel]="keyword"
            (ngModelChange)="setKeyword($event)"
            aria-label="Search tasks">
        </div>
        <div class="filter-group">
          <span class="filter-label">Status</span>
          <button
            *ngFor="let s of statusFilters"
            class="filter-pill"
            [class.active]="activeStatus === s.value"
            (click)="setStatus(s.value)"
            type="button"
          >{{ s.label }}</button>
        </div>
        <div class="filter-group">
          <span class="filter-label">Priority</span>
          <button
            *ngFor="let p of priorityFilters"
            class="filter-pill"
            [class.active]="activePriority === p.value"
            (click)="setPriority(p.value)"
            type="button"
          >{{ p.label }}</button>
        </div>
      </div>

      <div class="advanced-filters">
        <label>
          <span>Project</span>
          <select [(ngModel)]="selectedProjectId" (ngModelChange)="loadTasks()">
            <option value="">All projects</option>
            <option *ngFor="let project of projects" [value]="project.id">{{ project.title }}</option>
          </select>
        </label>
        <label>
          <span>Assignee</span>
          <select [(ngModel)]="selectedAssigneeId" (ngModelChange)="loadTasks()">
            <option value="">Anyone</option>
            <option *ngFor="let assignee of assignees" [value]="assignee.id">{{ assignee.username }}</option>
          </select>
        </label>
        <label>
          <span>Due from</span>
          <input type="date" [(ngModel)]="dueFrom" (ngModelChange)="loadTasks()">
        </label>
        <label>
          <span>Due to</span>
          <input type="date" [(ngModel)]="dueTo" (ngModelChange)="loadTasks()">
        </label>
        <label>
          <span>Sort</span>
          <select [(ngModel)]="sortMode" (ngModelChange)="loadTasks()">
            <option value="updated">Recently updated</option>
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
            <option value="created">Recently created</option>
          </select>
        </label>
        <button class="clear-btn" type="button" (click)="clearFilters()">Clear filters</button>
      </div>

      <!-- Loading -->
      <div class="loading-row" *ngIf="loading">
        <div class="spinner"></div>
        <span>Loading tasks…</span>
      </div>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!loading && !tasks.length">
        <div class="empty-icon">✓</div>
        <p>No tasks found</p>
        <span>Try adjusting the filters.</span>
      </div>

      <!-- Table -->
      <div class="table-wrapper" *ngIf="!loading && tasks.length">
        <table class="tasks-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Project</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            <tr
              *ngFor="let task of tasks"
              class="task-row"
              (click)="open(task.id)"
              tabindex="0"
              (keydown.enter)="open(task.id)"
            >
              <td class="task-title-cell">
                <span class="task-title">{{ task.title }}</span>
                <span class="task-id" *ngIf="task.taskIdentifier">{{ task.taskIdentifier }}</span>
              </td>
              <td class="project-cell">
                <span class="project-tag">{{ task.projectTitle || '—' }}</span>
              </td>
              <td>
                <span class="priority-badge" [class]="task.priority.toLowerCase()">
                  <span class="priority-dot"></span>
                  {{ task.priority }}
                </span>
              </td>
              <td>
                <span class="status-chip" [class]="task.status.toLowerCase().replace('_','-')">
                  {{ statusLabel(task.status) }}
                </span>
              </td>
              <td class="assignee-cell">
                <ng-container *ngIf="task.assignee; else unassigned">
                  <div class="assignee-row">
                    <div class="avatar-sm">{{ initials(task.assignee.username) }}</div>
                    <span>{{ task.assignee.username }}</span>
                  </div>
                </ng-container>
                <ng-template #unassigned>
                  <span class="unassigned">Unassigned</span>
                </ng-template>
              </td>
              <td class="due-cell">
                <span [class.overdue]="isOverdue(task.dueDate)">
                  {{ task.dueDate ? (task.dueDate | date:'MMM d') : '—' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .tasks-page {
      min-height: 100%;
      padding: 32px;
      background: var(--bg-base);
      color: var(--text-primary);
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    h1 {
      font-size: 24px;
      font-weight: 600;
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

    .filters-bar {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .search-box {
      min-width: min(340px, 100%);
      height: 40px;
      padding: 0 14px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .search-box input {
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
      color: var(--text-primary);
      font: inherit;
    }

    .search-box input::placeholder {
      color: var(--text-tertiary);
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .filter-label {
      font-size: 12px;
      color: var(--text-tertiary);
      margin-right: 4px;
    }

    .filter-pill {
      height: 26px;
      padding: 0 10px;
      border-radius: var(--radius-full);
      border: 1px solid var(--border-subtle);
      background: transparent;
      color: var(--text-secondary);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .filter-pill.active {
      background: var(--accent-dim);
      border-color: var(--accent);
      color: var(--accent);
    }

    .filter-pill:hover:not(.active) {
      border-color: var(--border-default);
      color: var(--text-primary);
    }

    .advanced-filters {
      display: grid;
      grid-template-columns: repeat(5, minmax(150px, 1fr)) auto;
      gap: 12px;
      align-items: end;
      margin-bottom: 24px;
      padding: 14px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      background: var(--bg-surface);
    }

    .advanced-filters label {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .advanced-filters label span {
      font-size: 11px;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .advanced-filters select,
    .advanced-filters input {
      height: 36px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      color: var(--text-primary);
      padding: 0 10px;
      outline: none;
    }

    .clear-btn {
      height: 36px;
      padding: 0 14px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .clear-btn:hover {
      color: var(--text-primary);
      border-color: var(--border-default);
    }

    .loading-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 48px 0;
      justify-content: center;
      color: var(--text-secondary);
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

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 80px 0;
      color: var(--text-secondary);
    }

    .empty-icon {
      font-size: 40px;
      opacity: 0.3;
      margin-bottom: 8px;
    }

    .empty-state p { font-size: 16px; color: var(--text-primary); }

    .table-wrapper {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .tasks-table {
      width: 100%;
      border-collapse: collapse;
    }

    thead tr {
      border-bottom: 1px solid var(--border-subtle);
    }

    th {
      padding: 12px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .task-row {
      border-bottom: 1px solid var(--border-subtle);
      cursor: pointer;
      transition: background 0.12s;
    }

    .task-row:last-child { border-bottom: none; }

    .task-row:hover { background: var(--bg-elevated); }

    td {
      padding: 12px 16px;
      font-size: 13px;
      vertical-align: middle;
    }

    .task-title-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .task-title {
      color: var(--text-primary);
      font-weight: 500;
    }

    .task-id {
      font-size: 11px;
      color: var(--text-tertiary);
    }

    .project-tag {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      background: var(--bg-elevated);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
    }

    .priority-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .priority-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .priority-badge.low .priority-dot { background: var(--success); }
    .priority-badge.low { color: var(--success); }
    .priority-badge.medium .priority-dot { background: var(--warning); }
    .priority-badge.medium { color: var(--warning); }
    .priority-badge.high .priority-dot { background: var(--danger); }
    .priority-badge.high { color: var(--danger); }
    .priority-badge.critical .priority-dot { background: #ff3333; }
    .priority-badge.critical { color: #ff3333; }

    .status-chip {
      display: inline-flex;
      align-items: center;
      height: 22px;
      padding: 0 8px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
    }

    .status-chip.todo { background: var(--bg-elevated); color: var(--text-secondary); }
    .status-chip.in-progress { background: var(--info-dim); color: var(--info); }
    .status-chip.blocked { background: var(--danger-dim); color: var(--danger); }
    .status-chip.in-review { background: var(--warning-dim); color: var(--warning); }
    .status-chip.done { background: var(--success-dim); color: var(--success); }

    .assignee-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .avatar-sm {
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
      flex-shrink: 0;
    }

    .unassigned {
      color: var(--text-tertiary);
      font-style: italic;
    }

    .due-cell span {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .due-cell .overdue {
      color: var(--danger);
      font-weight: 500;
    }

    @media (max-width: 1100px) {
      .advanced-filters {
        grid-template-columns: repeat(2, minmax(160px, 1fr));
      }
    }

    @media (max-width: 700px) {
      .tasks-page { padding: 20px; }
      .advanced-filters { grid-template-columns: 1fr; }
      .filter-group { flex-wrap: wrap; }
    }
  `]
})
export default class TaskListComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly router = inject(Router);
  private readonly keywordSubject = new Subject<string>();

  tasks: Task[] = [];
  projects: Project[] = [];
  assignees: User[] = [];
  totalTasks = 0;
  loading = true;
  activeStatus = 'ALL';
  activePriority = 'ALL';
  keyword = '';
  selectedProjectId = '';
  selectedAssigneeId = '';
  dueFrom = '';
  dueTo = '';
  sortMode = 'updated';

  readonly statusFilters = [
    { label: 'All', value: 'ALL' },
    { label: 'To Do', value: 'TODO' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Blocked', value: 'BLOCKED' },
    { label: 'In Review', value: 'IN_REVIEW' },
    { label: 'Done', value: 'DONE' },
  ];

  readonly priorityFilters = [
    { label: 'All', value: 'ALL' },
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Critical', value: 'CRITICAL' },
  ];

  ngOnInit(): void {
    this.loadFilterOptions();
    this.keywordSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.loadTasks());
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getAll({
      status: this.activeStatus !== 'ALL' ? this.activeStatus as TaskStatus : undefined,
      priority: this.activePriority !== 'ALL' ? this.activePriority as TaskPriority : undefined,
      keyword: this.keyword || undefined,
      projectId: this.selectedProjectId || undefined,
      assigneeId: this.selectedAssigneeId || undefined,
      dueFrom: this.dueFrom || undefined,
      dueTo: this.dueTo || undefined,
      sort: this.sortMode,
      page: 0,
      size: 200,
    }).subscribe({
      next: (page) => {
        this.tasks = page.content;
        this.totalTasks = page.totalElements;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  setStatus(value: string): void {
    this.activeStatus = value;
    this.loadTasks();
  }

  setKeyword(value: string): void {
    this.keyword = value;
    this.keywordSubject.next(value);
  }

  clearFilters(): void {
    this.activeStatus = 'ALL';
    this.activePriority = 'ALL';
    this.keyword = '';
    this.selectedProjectId = '';
    this.selectedAssigneeId = '';
    this.dueFrom = '';
    this.dueTo = '';
    this.sortMode = 'updated';
    this.loadTasks();
  }

  setPriority(value: string): void {
    this.activePriority = value;
    this.loadTasks();
  }

  open(id: string): void {
    this.router.navigate(['/tasks', id]);
  }

  statusLabel(status: TaskStatus): string {
    const map: Record<TaskStatus, string> = {
      TODO: 'To Do', IN_PROGRESS: 'In Progress', BLOCKED: 'Blocked', IN_REVIEW: 'In Review', DONE: 'Done'
    };
    return map[status] ?? status;
  }

  isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  initials(name: string): string {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }

  private loadFilterOptions(): void {
    forkJoin({
      projects: this.projectService.search({ sort: 'title' }),
      workspaces: this.workspaceService.getAll(),
    }).subscribe({
      next: ({ projects, workspaces }) => {
        this.projects = projects;
        const users = new Map<string, User>();
        workspaces.forEach((workspace) => {
          if (workspace.owner) users.set(workspace.owner.id, workspace.owner);
          workspace.members?.forEach((member) => users.set(member.id, member));
        });
        this.assignees = [...users.values()].sort((a, b) => a.username.localeCompare(b.username));
      },
    });
  }
}
