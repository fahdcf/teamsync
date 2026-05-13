import { Component, OnDestroy, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, finalize, switchMap, takeUntil, tap } from 'rxjs/operators';
import { AuthStore } from '../../store/auth.store';
import { NotificationStore } from '../../store/notification.store';
import { TokenService } from '../../core/services/token.service';
import { SidebarStateService } from '../../core/services/sidebar-state.service';
import { WorkspaceContextService } from '../../core/services/workspace-context.service';
import { SearchService } from '../../api/search.service';
import { ProjectService } from '../../api/project.service';
import { TaskService } from '../../api/task.service';
import { WorkspaceService } from '../../api/workspace.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { Project } from '../../shared/models/project.model';
import { SearchResult, SearchResultType } from '../../shared/models/search.model';
import { TaskPriority } from '../../shared/models/task.model';
import { User } from '../../shared/models/user.model';
import { Workspace } from '../../shared/models/workspace.model';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

interface BreadcrumbItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterLink, ReactiveFormsModule, AvatarComponent, ClickOutsideDirective, ModalComponent, RelativeTimePipe],
  template: `
    <nav class="navbar">
      <div class="navbar-left">
        <button class="hamburger" (click)="sidebarState.toggle()" aria-label="Toggle menu" type="button">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <rect y="2" width="16" height="1.5" rx="0.75"></rect>
            <rect y="7" width="16" height="1.5" rx="0.75"></rect>
            <rect y="12" width="16" height="1.5" rx="0.75"></rect>
          </svg>
        </button>

        <div class="breadcrumb">
          <ng-container *ngFor="let crumb of breadcrumbs; let first = first; let last = last">
            <a [routerLink]="crumb.route" class="crumb" [class.current]="last">
              <svg *ngIf="first" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
                <path d="M2 6.2 8 2l6 4.2V14H2V6.2Z"></path>
                <path d="M5.2 8.6h5.6"></path>
              </svg>
              <span>{{ crumb.label }}</span>
            </a>
            <span class="crumb-sep" *ngIf="!last">&#8250;</span>
          </ng-container>
        </div>
      </div>

      <div class="search-wrap" appClickOutside (clickOutside)="closeSearch()">
        <label class="search-bar" aria-label="Search">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <circle cx="6" cy="6" r="4"></circle>
            <path d="M9.5 9.5l3 3" stroke-linecap="round"></path>
          </svg>
          <input
            type="text"
            class="search-input"
            placeholder="Search projects, tasks, people..."
            [value]="searchQuery"
            (input)="onSearchInput($event)"
            (focus)="openSearch()"
            (keydown.enter)="openFirstSearchResult()"
            (keydown.escape)="closeSearch()"
          />
          <span class="search-shortcut">/</span>
        </label>

        <div class="search-dropdown" *ngIf="isSearchOpen && searchQuery.trim()">
          <div class="search-state" *ngIf="isSearchLoading">Searching...</div>
          <ng-container *ngIf="!isSearchLoading">
            <ng-container *ngFor="let group of groupedSearchResults">
              <div class="search-group-label">{{ group.label }}</div>
              <button
                *ngFor="let result of group.items"
                class="search-result"
                type="button"
                (click)="openSearchResult(result)"
              >
                <span class="result-kind">{{ result.type.charAt(0) }}</span>
                <span class="result-copy">
                  <strong>{{ result.title }}</strong>
                  <small>{{ result.subtitle }}</small>
                </span>
                <span class="result-route">{{ typeLabel(result.type) }}</span>
              </button>
            </ng-container>
            <div class="search-state" *ngIf="!searchResults.length">No results found</div>
          </ng-container>
        </div>
      </div>

      <div class="navbar-right">
        <div class="new-menu" appClickOutside (clickOutside)="isNewMenuOpen = false">
          <button class="new-btn" type="button" (click)="toggleNewMenu()">
            <span>+ New</span>
            <span class="caret">v</span>
          </button>

          <div class="new-dropdown" *ngIf="isNewMenuOpen">
            <button type="button" (click)="openCreate('workspace')">
              <strong>Workspace</strong>
              <span>Start a new team space</span>
            </button>
            <button type="button" (click)="openCreate('project')">
              <strong>Project</strong>
              <span>Plan work inside a workspace</span>
            </button>
            <button type="button" (click)="openCreate('task')">
              <strong>Task</strong>
              <span>Add work to a project</span>
            </button>
          </div>
        </div>

        <div
          class="notif-trigger"
          appClickOutside
          (clickOutside)="isNotifOpen = false"
          (click)="isNotifOpen = !isNotifOpen"
        >
          <button class="icon-btn" type="button" aria-label="Notifications">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M8 2a5 5 0 00-5 5v3l-1 1h12l-1-1V7a5 5 0 00-5-5z"></path>
              <path d="M6.5 13a1.5 1.5 0 003 0"></path>
            </svg>
            <span class="notif-badge" *ngIf="(unreadCount$ | async)! > 0">{{ unreadCount$ | async }}</span>
          </button>

          <div class="notif-dropdown" *ngIf="isNotifOpen" (click)="$event.stopPropagation()">
            <div class="notif-header">
              <span>Notifications</span>
              <button class="mark-read-btn" type="button" (click)="notifStore.markAllRead()">Mark all read</button>
            </div>
            <div
              *ngFor="let notification of (notifications$ | async)"
              class="notif-item"
              [class.unread]="!notification.readStatus"
              (click)="notifStore.markRead(notification.id)"
            >
              <span class="notif-msg">{{ notification.message }}</span>
              <span class="notif-time">{{ notification.createdAt | relativeTime }}</span>
            </div>
            <div *ngIf="!(notifications$ | async)?.length" class="notif-empty">You're all caught up!</div>
          </div>
        </div>

        <div class="workspace-menu" appClickOutside (clickOutside)="isWorkspaceMenuOpen = false">
          <button class="workspace-btn" type="button" aria-label="Workspace selector" (click)="toggleWorkspaceMenu()">
            <span class="workspace-icon"></span>
            <span class="workspace-name">{{ selectedWorkspace?.name || 'Select workspace' }}</span>
            <span class="caret">v</span>
          </button>

          <div class="workspace-dropdown" *ngIf="isWorkspaceMenuOpen">
            <div class="workspace-dropdown-label">Workspaces</div>
            <button
              class="workspace-option"
              *ngFor="let workspace of workspaces"
              [class.active]="workspace.id === selectedWorkspace?.id"
              type="button"
              (click)="selectWorkspace(workspace)"
            >
              <span class="workspace-option-avatar">{{ workspace.name.charAt(0).toUpperCase() }}</span>
              <span>
                <strong>{{ workspace.name }}</strong>
                <small>{{ memberCount(workspace) }} member{{ memberCount(workspace) === 1 ? '' : 's' }}</small>
              </span>
            </button>
            <div class="workspace-empty" *ngIf="!workspaces.length">No workspaces yet</div>
            <button class="workspace-manage" type="button" (click)="openWorkspaceList()">Manage workspaces</button>
          </div>
        </div>

        <div class="avatar-stack" aria-label="Team members">
          <div class="stack-avatars">
            <app-avatar *ngFor="let member of visibleWorkspaceMembers" [user]="member" size="sm"></app-avatar>
          </div>
          <span class="overflow-badge" *ngIf="hiddenWorkspaceMemberCount > 0">+{{ hiddenWorkspaceMemberCount }}</span>
        </div>

        <div class="user-menu" appClickOutside (clickOutside)="isUserMenuOpen = false">
          <button type="button" class="menu-anchor" (click)="isUserMenuOpen = !isUserMenuOpen" aria-label="Open account menu">
            <app-avatar [user]="(user$ | async)!" size="sm"></app-avatar>
          </button>
          <div class="user-dropdown" *ngIf="isUserMenuOpen">
            <button (click)="logout()" class="logout-btn" type="button">Logout</button>
          </div>
        </div>
      </div>
    </nav>

    <app-modal [isOpen]="activeCreateModal === 'workspace'" title="New Workspace" size="sm" (closed)="closeCreateModal()">
      <form class="quick-create-form" [formGroup]="workspaceForm" (ngSubmit)="createWorkspace()">
        <label>
          <span>Name</span>
          <input type="text" formControlName="name" placeholder="Design Team" />
        </label>
        <label>
          <span>Description</span>
          <textarea formControlName="description" placeholder="What is this workspace for?"></textarea>
        </label>
        <p class="quick-error" *ngIf="createError">{{ createError }}</p>
        <div class="quick-actions">
          <button class="quick-secondary" type="button" (click)="closeCreateModal()">Cancel</button>
          <button class="quick-primary" type="submit" [disabled]="workspaceForm.invalid || isCreating">{{ isCreating ? 'Creating...' : 'Create Workspace' }}</button>
        </div>
      </form>
    </app-modal>

    <app-modal [isOpen]="activeCreateModal === 'project'" title="New Project" size="md" (closed)="closeCreateModal()">
      <form class="quick-create-form" [formGroup]="projectForm" (ngSubmit)="createProject()">
        <label>
          <span>Workspace</span>
          <select formControlName="workspaceId">
            <option value="">Select workspace</option>
            <option *ngFor="let workspace of workspaces" [value]="workspace.id">{{ workspace.name }}</option>
          </select>
        </label>
        <label>
          <span>Title</span>
          <input type="text" formControlName="title" placeholder="Project name" />
        </label>
        <label>
          <span>Description</span>
          <textarea formControlName="description" placeholder="What is this project about?"></textarea>
        </label>
        <div class="quick-grid">
          <label>
            <span>Deadline</span>
            <input type="date" formControlName="deadline" />
          </label>
          <label>
            <span>Manager</span>
            <select formControlName="managerId">
              <option value="">No manager</option>
              <option *ngFor="let member of selectedWorkspaceMembers" [value]="member.id">{{ member.username }}</option>
            </select>
          </label>
        </div>
        <p class="quick-empty" *ngIf="!workspaces.length">Create a workspace before adding projects.</p>
        <p class="quick-error" *ngIf="createError">{{ createError }}</p>
        <div class="quick-actions">
          <button class="quick-secondary" type="button" (click)="closeCreateModal()">Cancel</button>
          <button class="quick-primary" type="submit" [disabled]="projectForm.invalid || isCreating || !workspaces.length">{{ isCreating ? 'Creating...' : 'Create Project' }}</button>
        </div>
      </form>
    </app-modal>

    <app-modal [isOpen]="activeCreateModal === 'task'" title="New Task" size="md" (closed)="closeCreateModal()">
      <form class="quick-create-form" [formGroup]="taskForm" (ngSubmit)="createTask()">
        <label>
          <span>Project</span>
          <select formControlName="projectId">
            <option value="">Select project</option>
            <option *ngFor="let project of projects" [value]="project.id">{{ project.title }}</option>
          </select>
        </label>
        <label>
          <span>Title</span>
          <input type="text" formControlName="title" placeholder="Task title" />
        </label>
        <label>
          <span>Description</span>
          <textarea formControlName="description" placeholder="Optional description"></textarea>
        </label>
        <div class="quick-grid">
          <label>
            <span>Priority</span>
            <select formControlName="priority">
              <option *ngFor="let priority of priorities" [value]="priority">{{ priority }}</option>
            </select>
          </label>
          <label>
            <span>Due Date</span>
            <input type="date" formControlName="dueDate" />
          </label>
        </div>
        <p class="quick-empty" *ngIf="!projects.length">Create a project before adding tasks.</p>
        <p class="quick-error" *ngIf="createError">{{ createError }}</p>
        <div class="quick-actions">
          <button class="quick-secondary" type="button" (click)="closeCreateModal()">Cancel</button>
          <button class="quick-primary" type="submit" [disabled]="taskForm.invalid || isCreating || !projects.length">{{ isCreating ? 'Creating...' : 'Create Task' }}</button>
        </div>
      </form>
    </app-modal>
  `,
  styles: [
    `
      .navbar {
        height: 52px;
        padding: 0 20px;
        border-bottom: 1px solid var(--border-subtle);
        background: var(--bg-base);
        display: grid;
        grid-template-columns: minmax(260px, 1fr) 320px minmax(420px, 1fr);
        align-items: center;
        gap: 12px;
      }

      .navbar-left {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .hamburger {
        display: none;
        width: 30px;
        height: 30px;
        border: none;
        border-radius: var(--radius-md);
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        align-items: center;
        justify-content: center;
      }

      .hamburger:hover {
        background: var(--bg-elevated);
        color: var(--text-primary);
      }

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .crumb {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--text-secondary);
        font-size: 13px;
        text-decoration: none;
        min-width: 0;
      }

      .crumb.current {
        color: var(--text-primary);
      }

      .crumb span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .crumb-sep {
        color: var(--text-tertiary);
        font-size: 13px;
      }

      .search-wrap {
        position: relative;
        min-width: 0;
      }

      .search-bar {
        height: 32px;
        padding: 0 12px;
        border-radius: var(--radius-full);
        border: 1px solid var(--border-subtle);
        background: var(--bg-elevated);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .search-bar:focus-within {
        border-color: var(--border-default);
      }

      .search-icon {
        color: var(--text-tertiary);
        flex-shrink: 0;
      }

      .search-input {
        flex: 1;
        min-width: 0;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        font-size: 13px;
        outline: none;
      }

      .search-input::placeholder {
        color: var(--text-tertiary);
      }

      .search-shortcut {
        color: var(--text-tertiary);
        border: 1px solid var(--border-subtle);
        background: var(--bg-overlay);
        border-radius: 6px;
        padding: 0 8px;
        line-height: 18px;
        font-size: 11px;
      }

      .search-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        left: 50%;
        width: min(460px, 90vw);
        max-height: 440px;
        overflow-y: auto;
        transform: translateX(-50%);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-xl);
        background: var(--bg-surface);
        box-shadow: var(--shadow-lg);
        padding: 10px;
        z-index: 260;
      }

      .search-group-label {
        padding: 8px 8px 6px;
        color: var(--text-tertiary);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .search-result {
        width: 100%;
        min-height: 52px;
        border: 0;
        border-radius: var(--radius-lg);
        background: transparent;
        color: var(--text-primary);
        display: grid;
        grid-template-columns: 32px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        padding: 8px;
        text-align: left;
        cursor: pointer;
      }

      .search-result:hover {
        background: var(--bg-elevated);
      }

      .result-kind {
        width: 32px;
        height: 32px;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-subtle);
        background: var(--accent-dim);
        color: var(--accent);
        display: grid;
        place-items: center;
        font-size: 12px;
        font-weight: 800;
      }

      .result-copy {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .result-copy strong,
      .result-copy small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .result-copy strong {
        color: var(--text-primary);
        font-size: 13px;
        font-weight: 600;
      }

      .result-copy small,
      .result-route,
      .search-state {
        color: var(--text-secondary);
        font-size: 12px;
      }

      .result-route {
        padding: 3px 8px;
        border-radius: var(--radius-full);
        background: var(--bg-elevated);
      }

      .search-state {
        padding: 18px 12px;
        text-align: center;
      }

      .navbar-right {
        margin-left: auto;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
      }

      .new-menu {
        position: relative;
      }

      .workspace-menu {
        position: relative;
      }

      .new-btn,
      .workspace-btn {
        height: 32px;
        padding: 0 10px;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-subtle);
        background: var(--bg-elevated);
        color: var(--text-primary);
        font-size: 13px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .new-btn {
        padding: 0 14px;
        border-color: var(--border-default);
      }

      .new-btn:hover,
      .workspace-btn:hover {
        border-color: var(--border-strong);
      }

      .new-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 250px;
        padding: 8px;
        border: 1px solid var(--border-default);
        border-radius: var(--radius-xl);
        background: var(--bg-surface);
        box-shadow: var(--shadow-lg);
        z-index: 260;
      }

      .new-dropdown button {
        width: 100%;
        min-height: 56px;
        border: 0;
        border-radius: var(--radius-lg);
        background: transparent;
        color: var(--text-primary);
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        gap: 4px;
        padding: 10px 12px;
        text-align: left;
        cursor: pointer;
      }

      .new-dropdown button:hover {
        background: var(--bg-elevated);
      }

      .new-dropdown strong {
        font-size: 13px;
      }

      .new-dropdown span {
        color: var(--text-secondary);
        font-size: 12px;
      }

      .caret {
        color: var(--text-secondary);
        font-size: 11px;
      }

      .workspace-icon {
        width: 14px;
        height: 14px;
        border-radius: 4px;
        border: 1px solid var(--border-default);
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.08));
      }

      .workspace-name {
        max-width: 110px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .notif-trigger {
        position: relative;
      }

      .icon-btn {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: var(--radius-md);
        background: transparent;
        color: var(--text-secondary);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: relative;
      }

      .icon-btn:hover {
        background: var(--bg-elevated);
        color: var(--text-primary);
      }

      .notif-badge {
        position: absolute;
        top: 3px;
        right: 3px;
        min-width: 12px;
        height: 12px;
        border-radius: 9999px;
        padding: 0 2px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--danger);
        color: #fff;
        font-size: 10px;
        line-height: 1;
      }

      .notif-dropdown {
        position: absolute;
        right: 0;
        top: calc(100% + 8px);
        width: 320px;
        border: 1px solid var(--border-default);
        border-radius: var(--radius-xl);
        background: var(--bg-surface);
        box-shadow: var(--shadow-lg);
        z-index: 250;
      }

      .notif-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-subtle);
        font-size: 13px;
        font-weight: 600;
      }

      .mark-read-btn {
        border: none;
        background: transparent;
        color: var(--accent);
        font-size: 12px;
        cursor: pointer;
      }

      .notif-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 10px 16px;
        border-bottom: 1px solid var(--border-subtle);
        cursor: pointer;
      }

      .notif-item:hover {
        background: var(--bg-elevated);
      }

      .notif-item.unread {
        background: var(--accent-glow);
      }

      .notif-msg {
        font-size: 13px;
        color: var(--text-primary);
      }

      .notif-time {
        font-size: 11px;
        color: var(--text-tertiary);
      }

      .notif-empty {
        padding: 16px;
        text-align: center;
        color: var(--text-tertiary);
        font-size: 12px;
      }

      .avatar-stack {
        height: 32px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .stack-avatars {
        display: inline-flex;
        align-items: center;
      }

      .stack-avatars app-avatar {
        margin-left: -8px;
        transition: transform 0.2s ease;
      }

      .stack-avatars app-avatar:first-child {
        margin-left: 0;
      }

      .avatar-stack:hover .stack-avatars app-avatar:nth-child(2) {
        transform: translateX(2px);
      }

      .avatar-stack:hover .stack-avatars app-avatar:nth-child(3) {
        transform: translateX(4px);
      }

      .overflow-badge {
        font-size: 12px;
        color: var(--text-secondary);
      }

      .user-menu {
        position: relative;
      }

      .menu-anchor {
        border: none;
        background: transparent;
        padding: 0;
        cursor: pointer;
      }

      .user-dropdown {
        position: absolute;
        right: 0;
        top: calc(100% + 8px);
        min-width: 120px;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-default);
        background: var(--bg-surface);
        box-shadow: var(--shadow-md);
        z-index: 250;
      }

      .logout-btn {
        width: 100%;
        padding: 10px 16px;
        border: none;
        background: transparent;
        color: var(--danger);
        text-align: left;
        font-size: 13px;
        cursor: pointer;
      }

      .logout-btn:hover {
        background: var(--danger-dim);
      }

      @media (max-width: 1200px) {
        .navbar {
          grid-template-columns: minmax(220px, 1fr) 280px minmax(280px, 1fr);
        }

        .workspace-menu,
        .avatar-stack,
        .user-menu {
          display: none;
        }
      }

      @media (max-width: 900px) {
        .navbar {
          grid-template-columns: 1fr;
          gap: 8px;
          height: auto;
          padding: 10px 16px;
        }

        .hamburger {
          display: inline-flex;
        }

        .search-bar {
          width: 100%;
        }

        .search-dropdown {
          left: 0;
          width: 100%;
          transform: none;
        }

        .navbar-right {
          width: 100%;
          justify-content: flex-start;
        }
      }
    `,
  ],
})
export class NavbarComponent implements OnDestroy {
  readonly authStore = inject(AuthStore);
  readonly notifStore = inject(NotificationStore);
  readonly sidebarState = inject(SidebarStateService);
  private readonly searchService = inject(SearchService);
  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly tokenService = inject(TokenService);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly searchInput$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  readonly user$ = this.authStore.user$;
  readonly notifications$ = this.notifStore.notifications$;
  readonly unreadCount$ = this.notifStore.unreadCount$;

  isNotifOpen = false;
  isUserMenuOpen = false;
  isSearchOpen = false;
  isSearchLoading = false;
  isNewMenuOpen = false;
  isWorkspaceMenuOpen = false;
  isCreating = false;
  activeCreateModal: 'workspace' | 'project' | 'task' | null = null;
  createError = '';
  searchQuery = '';
  searchResults: SearchResult[] = [];
  breadcrumbs: BreadcrumbItem[] = [{ label: 'Dashboard', route: '/dashboard' }];
  workspaces: Workspace[] = [];
  selectedWorkspace: Workspace | null = null;
  projects: Project[] = [];

  readonly priorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  readonly workspaceForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  readonly projectForm = this.fb.group({
    workspaceId: ['', Validators.required],
    title: ['', Validators.required],
    description: [''],
    deadline: [''],
    managerId: [''],
  });

  readonly taskForm = this.fb.group({
    projectId: ['', Validators.required],
    title: ['', Validators.required],
    description: [''],
    priority: ['MEDIUM' as TaskPriority],
    dueDate: [''],
  });

  readonly searchTypes: { type: SearchResultType; label: string }[] = [
    { type: 'WORKSPACE', label: 'Workspaces' },
    { type: 'PROJECT', label: 'Projects' },
    { type: 'TASK', label: 'Tasks' },
    { type: 'USER', label: 'People' },
  ];

  constructor() {
    this.loadWorkspaceSelector();
    this.updateBreadcrumbs(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe((event) => this.updateBreadcrumbs(event.urlAfterRedirects));

    this.searchInput$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        tap((query) => {
          this.isSearchOpen = !!query.trim();
          this.isSearchLoading = !!query.trim();
          if (!query.trim()) {
            this.searchResults = [];
            this.isSearchLoading = false;
          }
        }),
        switchMap((query) => {
          const trimmed = query.trim();
          if (!trimmed) return of([] as SearchResult[]);
          return this.searchService.search(trimmed).pipe(catchError(() => of([] as SearchResult[])));
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((results) => {
        this.searchResults = results;
        this.isSearchLoading = false;
      });
  }

  get groupedSearchResults(): { label: string; items: SearchResult[] }[] {
    return this.searchTypes
      .map((group) => ({
        label: group.label,
        items: this.searchResults.filter((result) => result.type === group.type),
      }))
      .filter((group) => group.items.length);
  }

  get selectedWorkspaceMembers(): User[] {
    const workspace = this.workspaces.find((candidate) => candidate.id === this.projectForm.value.workspaceId);
    if (!workspace) return [];
    const users = new Map<string, User>();
    if (workspace.owner) users.set(workspace.owner.id, workspace.owner);
    (workspace.members || []).forEach((member) => users.set(member.id, member));
    return Array.from(users.values());
  }

  get visibleWorkspaceMembers(): User[] {
    return this.currentWorkspaceMembers.slice(0, 3);
  }

  get hiddenWorkspaceMemberCount(): number {
    return Math.max(0, this.currentWorkspaceMembers.length - this.visibleWorkspaceMembers.length);
  }

  private get currentWorkspaceMembers(): User[] {
    if (!this.selectedWorkspace) return [];
    const users = new Map<string, User>();
    if (this.selectedWorkspace.owner) users.set(this.selectedWorkspace.owner.id, this.selectedWorkspace.owner);
    (this.selectedWorkspace.members || []).forEach((member) => users.set(member.id, member));
    return Array.from(users.values());
  }

  toggleNewMenu(): void {
    this.isNewMenuOpen = !this.isNewMenuOpen;
    if (this.isNewMenuOpen) this.loadCreateOptions();
  }

  toggleWorkspaceMenu(): void {
    this.isWorkspaceMenuOpen = !this.isWorkspaceMenuOpen;
    if (this.isWorkspaceMenuOpen) this.loadWorkspaceSelector();
  }

  selectWorkspace(workspace: Workspace): void {
    this.workspaceContext.selectWorkspace(workspace.id);
    this.selectedWorkspace = workspace;
    this.isWorkspaceMenuOpen = false;

    const path = this.router.url.split('?')[0].split('#')[0];
    if (path === '/workspaces' || path.startsWith('/workspaces/')) {
      this.router.navigate(['/workspaces', workspace.id]);
      return;
    }

    if (path === '/projects') {
      this.router.navigate(['/projects'], { queryParams: { workspaceId: workspace.id } });
    }
  }

  openWorkspaceList(): void {
    this.isWorkspaceMenuOpen = false;
    this.router.navigate(['/workspaces']);
  }

  memberCount(workspace: Workspace): number {
    const members = new Set<string>();
    if (workspace.owner?.id) members.add(workspace.owner.id);
    (workspace.members || []).forEach((member) => members.add(member.id));
    return members.size;
  }

  openCreate(type: 'workspace' | 'project' | 'task'): void {
    this.isNewMenuOpen = false;
    this.createError = '';
    this.activeCreateModal = type;
    if (type !== 'workspace') this.loadCreateOptions();
  }

  closeCreateModal(): void {
    if (this.isCreating) return;
    this.activeCreateModal = null;
    this.createError = '';
  }

  createWorkspace(): void {
    if (this.workspaceForm.invalid) {
      this.workspaceForm.markAllAsTouched();
      return;
    }

    const { name, description } = this.workspaceForm.value;
    this.isCreating = true;
    this.createError = '';
    this.workspaceService.create({ name: name!, description: description || '' })
      .pipe(finalize(() => (this.isCreating = false)))
      .subscribe({
        next: (workspace) => {
          this.workspaceForm.reset();
          this.activeCreateModal = null;
          this.router.navigate(['/workspaces', workspace.id]);
        },
        error: () => (this.createError = 'Workspace could not be created. Please try again.'),
      });
  }

  createProject(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    const { workspaceId, title, description, deadline, managerId } = this.projectForm.value;
    this.isCreating = true;
    this.createError = '';
    this.projectService.create(workspaceId!, {
      title: title!,
      description: description || '',
      deadline: deadline || '',
      managerId: managerId || '',
    })
      .pipe(finalize(() => (this.isCreating = false)))
      .subscribe({
        next: (project) => {
          this.projectForm.reset();
          this.activeCreateModal = null;
          this.router.navigate(['/projects', project.id]);
        },
        error: () => (this.createError = 'Project could not be created. Please check the fields and try again.'),
      });
  }

  createTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const { projectId, title, description, priority, dueDate } = this.taskForm.value;
    this.isCreating = true;
    this.createError = '';
    this.taskService.create(projectId!, {
      title: title!,
      description: description || '',
      priority: priority as TaskPriority,
      dueDate: dueDate || undefined,
    })
      .pipe(finalize(() => (this.isCreating = false)))
      .subscribe({
        next: (task) => {
          this.taskForm.reset({ priority: 'MEDIUM' });
          this.activeCreateModal = null;
          this.router.navigate(['/tasks', task.id]);
        },
        error: () => (this.createError = 'Task could not be created. Please check the fields and try again.'),
      });
  }

  private loadCreateOptions(): void {
    this.workspaceService.getAll()
      .pipe(
        switchMap((workspaces) => {
          this.workspaces = workspaces;
          if (!this.projectForm.value.workspaceId && workspaces[0]) {
            this.projectForm.patchValue({ workspaceId: workspaces[0].id, managerId: workspaces[0].owner?.id || '' });
          }
          if (!workspaces.length) return of([] as Project[][]);
          return forkJoin(workspaces.map((workspace) => this.projectService.getByWorkspace(workspace.id).pipe(catchError(() => of([] as Project[])))));
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((projectGroups) => {
        this.projects = projectGroups.flat();
        if (!this.taskForm.value.projectId && this.projects[0]) {
          this.taskForm.patchValue({ projectId: this.projects[0].id });
        }
      });
  }

  private loadWorkspaceSelector(): void {
    this.workspaceService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workspaces) => {
          this.workspaces = workspaces;
          this.selectedWorkspace = this.workspaceContext.syncAvailableWorkspaces(workspaces);
        },
        error: () => {
          this.workspaces = [];
          this.selectedWorkspace = null;
        },
      });
  }

  onSearchInput(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.searchInput$.next(this.searchQuery);
  }

  openSearch(): void {
    if (this.searchQuery.trim()) this.isSearchOpen = true;
  }

  closeSearch(): void {
    this.isSearchOpen = false;
  }

  openFirstSearchResult(): void {
    const [first] = this.searchResults;
    if (first) this.openSearchResult(first);
  }

  openSearchResult(result: SearchResult): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.closeSearch();
    this.router.navigateByUrl(result.route);
  }

  typeLabel(type: SearchResultType): string {
    const labels: Record<SearchResultType, string> = {
      WORKSPACE: 'Workspace',
      PROJECT: 'Project',
      TASK: 'Task',
      USER: 'Person',
    };
    return labels[type];
  }

  private updateBreadcrumbs(url: string): void {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/').filter(Boolean);
    const [section, id, child] = segments;

    if (!section || section === 'dashboard') {
      this.breadcrumbs = [{ label: 'Dashboard', route: '/dashboard' }];
      return;
    }

    if (section === 'workspaces') {
      this.breadcrumbs = [{ label: 'Workspaces', route: '/workspaces' }];
      if (id) this.loadWorkspaceBreadcrumb(id);
      return;
    }

    if (section === 'projects') {
      this.breadcrumbs = [{ label: 'Projects', route: '/projects' }];
      if (id) this.loadProjectBreadcrumb(id, child);
      return;
    }

    if (section === 'tasks') {
      this.breadcrumbs = [{ label: 'Tasks', route: '/tasks' }];
      if (id) this.loadTaskBreadcrumb(id);
      return;
    }

    this.breadcrumbs = [{ label: this.titleFromSegment(section), route: cleanUrl }];
  }

  private loadWorkspaceBreadcrumb(id: string): void {
    this.workspaceService.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (workspace) => {
        this.breadcrumbs = [
          { label: 'Workspaces', route: '/workspaces' },
          { label: workspace.name, route: `/workspaces/${workspace.id}` },
        ];
      },
    });
  }

  private loadProjectBreadcrumb(id: string, child?: string): void {
    this.projectService.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (project) => {
        const workspaceId = project.workspaceId || project.workspace?.id;
        const workspaceName = project.workspaceName || project.workspace?.name || 'Workspace';
        this.breadcrumbs = [
          { label: workspaceName, route: workspaceId ? `/workspaces/${workspaceId}` : '/workspaces' },
          { label: project.title, route: `/projects/${project.id}` },
          ...(child ? [{ label: this.titleFromSegment(child), route: `/projects/${project.id}/${child}` }] : []),
        ];
      },
    });
  }

  private loadTaskBreadcrumb(id: string): void {
    this.taskService.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (task) => {
        const projectId = task.projectId || task.project?.id;
        this.breadcrumbs = [
          { label: task.workspaceName || task.project?.workspaceName || task.project?.workspace?.name || 'Workspace', route: task.workspaceId ? `/workspaces/${task.workspaceId}` : '/workspaces' },
          { label: task.projectTitle || task.project?.title || 'Project', route: projectId ? `/projects/${projectId}` : '/projects' },
          { label: task.title, route: `/tasks/${task.id}` },
        ];
      },
    });
  }

  private titleFromSegment(segment: string): string {
    return segment
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  logout(): void {
    this.authStore.clearUser();
    this.tokenService.removeToken();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
