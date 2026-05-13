import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { WorkspaceActivity, WorkspaceService } from '../../../api/workspace.service';
import { ProjectService } from '../../../api/project.service';
import { Workspace } from '../../../shared/models/workspace.model';
import { Project } from '../../../shared/models/project.model';
import { User } from '../../../shared/models/user.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-workspace-detail',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    ModalComponent,
    EmptyStateComponent,
    SkeletonComponent,
  ],
  template: `
    <div *ngIf="isLoading" class="workspace-loading">
      <app-skeleton *ngFor="let i of [1,2,3]" type="card"></app-skeleton>
    </div>

    <app-empty-state
      *ngIf="!isLoading && hasError"
      variant="error"
      description="Failed to load workspace"
      (action)="load()">
    </app-empty-state>

    <div *ngIf="!isLoading && !hasError && workspace" class="workspace-detail-page refined">
      <main class="workspace-main">
        <section class="workspace-hero refined-hero">
          <span class="workspace-kicker">WORKSPACE</span>
          <div class="hero-content-row">
            <div class="workspace-avatar-xl">{{ firstLetter(workspace.name) }}</div>
            <div class="workspace-title-block">
              <h1>{{ workspace.name }}</h1>
              <p>{{ workspace.description || 'No description provided.' }}</p>
              <div class="workspace-members compact-members">
                <span *ngFor="let member of workspace.members | slice:0:3">{{ initials(member) }}</span>
                <button type="button" (click)="isAddMemberOpen = true" aria-label="Add member">+</button>
                <em>{{ memberCount }} members</em>
                <strong><i></i>{{ activeMembersCount }} active</strong>
              </div>
            </div>
          </div>

          <div class="workspace-hero-divider"></div>
          <div class="hero-summary-row">
            <div class="hero-meta-strip" aria-label="Workspace summary">
              <span><small>Active members</small><strong>{{ activeMembersCount }}</strong></span>
              <span><small>Projects</small><strong>{{ activeProjectCount }}</strong></span>
              <span><small>Tasks</small><strong>{{ completionRate }}%</strong></span>
            </div>
            <div class="workspace-actions hero-actions">
              <button type="button" class="invite-btn" (click)="isAddMemberOpen = true">
                <span aria-hidden="true">+</span> Invite members
              </button>
              <button type="button" class="settings-btn" (click)="openSettings()">
                <span aria-hidden="true">o</span> Workspace settings
              </button>
            </div>
          </div>
        </section>

        <section class="workspace-projects refined-projects">
          <div class="workspace-project-toolbar">
            <div class="project-toolbar-left">
              <h2>Projects</h2>
            </div>
            <div class="project-toolbar-right">
              <button type="button" (click)="isProjectFilterOpen = !isProjectFilterOpen">Filter</button>
              <select [value]="projectStatusFilter" (change)="setProjectStatus($event)">
                <option value="">All projects</option>
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <select [value]="projectSort" (change)="setProjectSort($event)">
                <option value="recent">Sort: Recent</option>
                <option value="deadline">Sort: Due date</option>
                <option value="progress">Sort: Progress</option>
                <option value="title">Sort: Title</option>
              </select>
            </div>
          </div>
          <div class="project-filter-row" *ngIf="isProjectFilterOpen">
            <input
              type="search"
              class="field-input"
              placeholder="Search projects..."
              [value]="projectKeyword"
              (input)="setProjectKeyword($event)"
            />
          </div>

          <article
            *ngFor="let project of projects; let i = index"
            class="workspace-project-row refined-project-card"
            (click)="router.navigate(['/projects', project.id])"
          >
            <div class="project-card-topline">
              <div class="project-thumb" [class]="'tone-' + (i % 3)">
                <button type="button" [attr.aria-label]="favoriteLabel(project)" (click)="toggleFavorite(project, $event)">
                  {{ project.favorite ? '★' : '☆' }}
                </button>
              </div>

              <div class="project-row-content">
                <div class="project-row-title">
                  <div>
                    <h3>{{ project.title }} <button type="button" [attr.aria-label]="favoriteLabel(project)" (click)="toggleFavorite(project, $event)">{{ project.favorite ? '★' : '☆' }}</button></h3>
                    <p>{{ project.description || 'No description provided.' }}</p>
                  </div>
                  <button type="button" aria-label="Project options" (click)="$event.stopPropagation()">...</button>
                </div>

                <div class="project-avatar-line">
                  <span *ngFor="let member of workspace.members | slice:0:4">{{ initials(member) }}</span>
                  <span *ngIf="workspace.members.length > 4">+{{ workspace.members.length - 4 }}</span>
                </div>

                <div class="project-stats-row">
                  <div>
                    <small>Progress</small>
                    <strong>{{ project.progress }}%</strong>
                    <div class="project-progress"><i [style.width.%]="project.progress" [class]="healthClass(project)"></i></div>
                  </div>
                  <div>
                    <small>Due date</small>
                    <strong>{{ project.deadline ? (project.deadline | date:'MMM d, y') : 'No deadline' }}</strong>
                  </div>
                  <div>
                    <small>Health</small>
                    <strong class="health-label" [class]="healthClass(project)"><i></i>{{ healthText(project) }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <app-empty-state
            *ngIf="!projects.length"
            title="No projects yet"
            description="Create the first project for this workspace"
            actionLabel="New Project"
            (action)="isCreateProjectOpen = true">
          </app-empty-state>
        </section>
      </main>

      <aside class="workspace-activity-panel refined-side-panel">
        <article class="side-activity-card">
          <div class="activity-header">
            <h2>Recent activity</h2>
            <button type="button">All activity v</button>
          </div>

          <div class="activity-timeline" *ngIf="activity.length; else emptyTimeline">
            <article class="timeline-row" *ngFor="let item of activity | slice:0:4; let i = index">
              <span class="timeline-icon" [class]="activityIcon(item.action)" aria-hidden="true"></span>
              <div>
                <strong>{{ readableActivity(item.action) }}</strong>
                <p>{{ item.user?.username || 'Just now' }}</p>
              </div>
            </article>
          </div>

          <ng-template #emptyTimeline>
            <div class="activity-timeline synthetic">
              <article class="timeline-row muted">
                <span class="timeline-icon empty" aria-hidden="true"></span>
                <div><strong>No recent activity yet.</strong><p>Just now</p></div>
              </article>
              <article class="timeline-row">
                <span class="timeline-icon green created" aria-hidden="true"></span>
                <div><strong>Workspace created</strong><p>{{ workspace.owner.username || 'TeamSync' }}</p></div>
              </article>
              <article class="timeline-row">
                <span class="timeline-icon amber member" aria-hidden="true"></span>
                <div><strong>Workspace member added</strong><p>{{ workspace.owner.username || 'TeamSync' }}</p></div>
              </article>
              <article class="timeline-row">
                <span class="timeline-icon purple project" aria-hidden="true"></span>
                <div><strong>Project created</strong><p>Just now</p></div>
              </article>
            </div>
          </ng-template>

          <a class="view-activity-link" href="#">View all activity -></a>
        </article>

        <article class="ai-recommendation-card">
          <div class="recommendation-title">
            <span class="spark-mark" aria-hidden="true">✦</span>
            <h2>AI recommendation</h2>
          </div>
          <div class="recommendation-preview" aria-hidden="true">
            <span></span>
            <span></span>
            <strong></strong>
          </div>
          <a href="#" aria-label="View AI recommendation">›</a>
        </article>
      </aside>
    </div>

    <app-modal [isOpen]="isAddMemberOpen" title="Add Member" size="sm" (closed)="isAddMemberOpen = false">
      <form [formGroup]="memberForm" (ngSubmit)="addMember()" class="form">
        <app-input label="Email address" type="email" placeholder="colleague@example.com" formControlName="email"></app-input>
        <div class="form-actions">
          <app-button variant="secondary" size="sm" (click)="isAddMemberOpen = false">Cancel</app-button>
          <app-button type="submit" size="sm" [loading]="isAddingMember">Add</app-button>
        </div>
      </form>
    </app-modal>

    <app-modal [isOpen]="isSettingsOpen" title="Workspace Settings" size="sm" (closed)="isSettingsOpen = false">
      <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()" class="form">
        <app-input label="Name" placeholder="Workspace name" formControlName="name"></app-input>
        <app-input label="Description" placeholder="Workspace description" formControlName="description"></app-input>
        <div class="form-actions">
          <app-button variant="secondary" size="sm" (click)="isSettingsOpen = false">Cancel</app-button>
          <app-button type="submit" size="sm" [loading]="isSavingSettings">Save</app-button>
        </div>
      </form>
    </app-modal>

    <app-modal [isOpen]="isCreateProjectOpen" title="New Project" (closed)="isCreateProjectOpen = false">
      <form [formGroup]="projectForm" (ngSubmit)="createProject()" class="form">
        <app-input label="Title" placeholder="Project name" formControlName="title"></app-input>
        <app-input label="Description" placeholder="What is this project about?" formControlName="description"></app-input>
        <div class="field">
          <label class="field-label">Deadline</label>
          <input type="date" class="field-input" formControlName="deadline">
        </div>
        <div class="field">
          <label class="field-label">Manager</label>
          <select class="field-input" formControlName="managerId">
            <option value="">Select manager</option>
            <option *ngFor="let member of workspace?.members" [value]="member.id">{{ member.username }}</option>
          </select>
        </div>
        <div class="form-actions">
          <app-button variant="secondary" size="sm" (click)="isCreateProjectOpen = false">Cancel</app-button>
          <app-button type="submit" size="sm" [loading]="isCreatingProject">Create</app-button>
        </div>
      </form>
    </app-modal>
  `,
  styles: [],
})
export default class WorkspaceDetailComponent implements OnInit {
  readonly workspaceService = inject(WorkspaceService);
  readonly projectService = inject(ProjectService);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  workspace: Workspace | null = null;
  projects: Project[] = [];
  activity: WorkspaceActivity[] = [];
  isLoading = true;
  hasError = false;
  isAddMemberOpen = false;
  isCreateProjectOpen = false;
  isSettingsOpen = false;
  isAddingMember = false;
  isCreatingProject = false;
  isSavingSettings = false;
  isProjectFilterOpen = false;
  projectStatusFilter = '';
  projectSort = 'recent';
  projectKeyword = '';

  memberForm = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  settingsForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });
  projectForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    deadline: [''],
    managerId: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  get memberCount(): number {
    return this.workspace?.members.length || 0;
  }

  get activeMembersCount(): number {
    return Math.min(5, this.memberCount);
  }

  get activeProjectCount(): number {
    return this.projects.filter((project) => project.status !== 'ARCHIVED').length;
  }

  get completionRate(): number {
    if (!this.projects.length) return 0;
    const total = this.projects.reduce((sum, project) => sum + (project.progress || 0), 0);
    return Math.round(total / this.projects.length);
  }

  load(): void {
    this.isLoading = true;
    this.hasError = false;
    const id = this.route.snapshot.paramMap.get('id')!;

    forkJoin({
      workspace: this.workspaceService.getById(id),
      projects: this.projectService.getByWorkspace(id, this.projectFilters()),
      activity: this.workspaceService.getActivity(id),
    }).subscribe({
      next: ({ workspace, projects, activity }) => {
        this.workspace = workspace;
        this.projects = projects;
        this.activity = activity;
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  addMember(): void {
    if (!this.memberForm.valid || !this.workspace) return;
    this.isAddingMember = true;
    this.workspaceService.addMember(this.workspace.id, this.memberForm.value.email!).subscribe({
      next: (workspace) => {
        this.workspace = workspace;
        this.isAddMemberOpen = false;
        this.memberForm.reset();
        this.isAddingMember = false;
      },
      error: () => (this.isAddingMember = false),
    });
  }

  openSettings(): void {
    if (!this.workspace) return;
    this.settingsForm.reset({
      name: this.workspace.name,
      description: this.workspace.description || '',
    });
    this.isSettingsOpen = true;
  }

  saveSettings(): void {
    if (!this.settingsForm.valid || !this.workspace) return;
    this.isSavingSettings = true;
    const { name, description } = this.settingsForm.value;
    this.workspaceService.update(this.workspace.id, {
      name: name!,
      description: description || '',
    }).subscribe({
      next: (workspace) => {
        this.workspace = workspace;
        this.isSettingsOpen = false;
        this.isSavingSettings = false;
        this.workspaceService.getActivity(workspace.id).subscribe({
          next: (activity) => (this.activity = activity),
          error: () => undefined,
        });
      },
      error: () => (this.isSavingSettings = false),
    });
  }

  loadProjects(): void {
    if (!this.workspace) return;
    this.projectService.getByWorkspace(this.workspace.id, this.projectFilters()).subscribe({
      next: (projects) => (this.projects = projects),
      error: () => (this.projects = []),
    });
  }

  setProjectStatus(event: Event): void {
    this.projectStatusFilter = (event.target as HTMLSelectElement).value;
    this.loadProjects();
  }

  setProjectSort(event: Event): void {
    this.projectSort = (event.target as HTMLSelectElement).value;
    this.loadProjects();
  }

  setProjectKeyword(event: Event): void {
    this.projectKeyword = (event.target as HTMLInputElement).value;
    this.loadProjects();
  }

  private projectFilters(): { status?: string; keyword?: string; sort?: string } {
    return {
      status: this.projectStatusFilter || undefined,
      keyword: this.projectKeyword || undefined,
      sort: this.projectSort,
    };
  }

  createProject(): void {
    if (!this.projectForm.valid || !this.workspace) return;
    this.isCreatingProject = true;
    const { title, description, deadline, managerId } = this.projectForm.value;
    this.projectService.create(this.workspace.id, {
      title: title!,
      description: description || '',
      deadline: deadline || '',
      managerId: managerId || '',
    }).subscribe({
      next: () => {
        this.loadProjects();
        this.isCreateProjectOpen = false;
        this.projectForm.reset();
        this.isCreatingProject = false;
      },
      error: () => (this.isCreatingProject = false),
    });
  }

  firstLetter(value: string): string {
    return (value || 'W').charAt(0).toUpperCase();
  }

  initials(user: User | null): string {
    if (!user?.username) return 'TS';
    return user.username
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  healthClass(project: Project): string {
    return (project.health || 'AT_RISK').toLowerCase();
  }

  healthText(project: Project): string {
    const health = project.health || 'AT_RISK';
    if (health === 'ON_TRACK') return 'On track';
    if (health === 'DELAYED') return 'Delayed';
    return 'At risk';
  }

  favoriteLabel(project: Project): string {
    return project.favorite ? 'Remove project from favorites' : 'Add project to favorites';
  }

  toggleFavorite(project: Project, event: Event): void {
    event.stopPropagation();
    this.projectService.toggleFavorite(project.id).subscribe({
      next: (updated) => {
        this.projects = this.projects.map((item) => item.id === updated.id ? { ...item, favorite: updated.favorite } : item);
      },
    });
  }

  activityIcon(action: string | null | undefined): string {
    if (!action) return 'empty';
    const normalized = action.toLowerCase();
    if (normalized.includes('member') || normalized.includes('assigned')) return 'member';
    if (normalized.includes('project')) return 'project';
    if (normalized.includes('workspace')) return 'created';
    return 'empty';
  }

  readableActivity(action: string): string {
    return action
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/^./, (letter) => letter.toUpperCase());
  }
}
