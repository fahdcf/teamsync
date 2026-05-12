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

    <div *ngIf="!isLoading && !hasError && workspace" class="workspace-detail-page">
      <main class="workspace-main">
        <section class="workspace-hero">
          <span class="workspace-kicker">✦ WORKSPACE</span>
          <h1>{{ workspace.name }}</h1>
          <p>{{ workspace.description }}</p>

          <div class="workspace-member-row">
            <div class="workspace-members">
              <span *ngFor="let member of workspace.members | slice:0:5">{{ initials(member) }}</span>
              <button type="button" (click)="isAddMemberOpen = true">+</button>
              <em>{{ workspace.members.length }} members</em>
              <strong><i></i>{{ activeMembersCount }} active</strong>
            </div>

            <div class="workspace-actions">
              <button type="button" (click)="isAddMemberOpen = true">Invite members</button>
              <button type="button">Workspace settings</button>
            </div>
          </div>
        </section>

        <section class="workspace-projects">
          <div class="workspace-project-toolbar">
            <div class="project-toolbar-left">
              <h2>Projects</h2>
              <button type="button" class="view-toggle active" aria-label="Grid view">▦</button>
              <button type="button" class="view-toggle" aria-label="List view">☰</button>
            </div>
            <div class="project-toolbar-right">
              <button type="button">Filter</button>
              <button type="button">All projects v</button>
              <button type="button">Sort: Recent v</button>
            </div>
          </div>

          <article
            *ngFor="let project of projects; let i = index"
            class="workspace-project-row"
            (click)="router.navigate(['/projects', project.id])"
          >
            <div class="project-thumb" [class]="'tone-' + (i % 3)"></div>
            <div class="project-row-content">
              <div class="project-row-title">
                <div>
                  <h3>{{ project.title }} <button type="button" (click)="$event.stopPropagation()">☆</button></h3>
                  <p>{{ project.description }}</p>
                </div>
                <button type="button" (click)="$event.stopPropagation()">...</button>
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

              <div class="project-insight-row">
                <span>⚡ AI Insight</span>
                <p>{{ project.insight || fallbackInsight(project) }}</p>
                <a href="#" (click)="$event.stopPropagation()">-></a>
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

      <aside class="workspace-activity-panel">
        <div class="activity-header">
          <h2>Recent activity</h2>
          <button type="button">All activity v</button>
        </div>

        <ng-container *ngFor="let group of activityGroups">
          <h3>{{ group.label }}</h3>
          <article class="activity-item" *ngFor="let activity of group.items">
            <time>{{ activity.createdAt | date:'h:mm a' }}</time>
            <span>{{ initials(activity.user) }}</span>
            <div>
              <p><strong>{{ activity.user?.username || 'TeamSync' }}</strong> {{ activity.action }}</p>
              <blockquote *ngIf="activity.action.includes('COMMENT')">{{ activity.action }}</blockquote>
            </div>
            <button type="button" aria-label="Open activity">□</button>
          </article>
        </ng-container>

        <p class="activity-empty" *ngIf="!activity.length">No recent activity yet.</p>
        <a class="view-activity-link" href="#">View all activity -></a>
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
  isAddingMember = false;
  isCreatingProject = false;

  memberForm = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  projectForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    deadline: [''],
    managerId: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  get activeMembersCount(): number {
    return Math.min(5, this.workspace?.members.length || 0);
  }

  get activityGroups(): { label: string; items: WorkspaceActivity[] }[] {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86_400_000).toDateString();
    const groups = [
      { label: 'Today', items: [] as WorkspaceActivity[] },
      { label: 'Yesterday', items: [] as WorkspaceActivity[] },
      { label: 'Earlier', items: [] as WorkspaceActivity[] },
    ];

    for (const item of this.activity) {
      const date = new Date(item.createdAt).toDateString();
      if (date === today) groups[0].items.push(item);
      else if (date === yesterday) groups[1].items.push(item);
      else groups[2].items.push(item);
    }
    return groups.filter((group) => group.items.length);
  }

  load(): void {
    this.isLoading = true;
    this.hasError = false;
    const id = this.route.snapshot.paramMap.get('id')!;

    forkJoin({
      workspace: this.workspaceService.getById(id),
      projects: this.projectService.getByWorkspace(id),
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
      next: (project) => {
        this.projects = [project, ...this.projects];
        this.isCreateProjectOpen = false;
        this.projectForm.reset();
        this.isCreatingProject = false;
      },
      error: () => (this.isCreatingProject = false),
    });
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

  fallbackInsight(project: Project): string {
    if (project.health === 'ON_TRACK') return 'Components are ahead of schedule. Consider starting documentation early.';
    if (project.health === 'DELAYED') return 'Significant delays detected. Schedule a team sync immediately.';
    return 'User testing results suggest reviewing the onboarding flow.';
  }
}
