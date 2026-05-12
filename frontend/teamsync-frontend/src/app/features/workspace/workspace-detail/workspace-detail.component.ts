import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkspaceService } from '../../../api/workspace.service';
import { ProjectService } from '../../../api/project.service';
import { Workspace } from '../../../shared/models/workspace.model';
import { Project } from '../../../shared/models/project.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { ProjectCardComponent } from '../../project/project-card/project-card.component';

@Component({
  selector: 'app-workspace-detail',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    AvatarComponent, ButtonComponent, InputComponent,
    ModalComponent, EmptyStateComponent, SpinnerComponent, ProjectCardComponent
  ],
  template: `
    <div *ngIf="isLoading" class="loading-center">
      <app-spinner size="lg"></app-spinner>
    </div>

    <div *ngIf="!isLoading && workspace" class="workspace-detail">
      <!-- Hero -->
      <div class="ws-hero">
        <div class="ws-info">
          <h1>{{ workspace.name }}</h1>
          <p class="ws-desc">{{ workspace.description }}</p>
        </div>
        <div class="ws-actions">
          <app-button variant="secondary" size="sm" (click)="isAddMemberOpen = true">Add Member</app-button>
          <app-button size="sm" (click)="isCreateProjectOpen = true">+ New Project</app-button>
        </div>
      </div>

      <!-- Members strip -->
      <div class="members-strip">
        <app-avatar
          *ngFor="let m of workspace.members | slice:0:8"
          [user]="m" size="sm"
          [title]="m.username">
        </app-avatar>
        <span *ngIf="workspace.members.length > 8" class="more-members">
          +{{ workspace.members.length - 8 }} more
        </span>
      </div>

      <!-- Projects -->
      <div class="section">
        <h2>Projects ({{ projects.length }})</h2>
        <div *ngIf="projects.length" class="projects-grid">
          <app-project-card
            *ngFor="let p of projects"
            [project]="p"
            (clicked)="router.navigate(['/projects', p.id])">
          </app-project-card>
        </div>
        <app-empty-state
          *ngIf="!projects.length"
          icon="🗂️"
          title="No projects yet"
          description="Create the first project for this workspace"
          actionLabel="New Project"
          (action)="isCreateProjectOpen = true">
        </app-empty-state>
      </div>
    </div>

    <!-- Add member modal -->
    <app-modal [isOpen]="isAddMemberOpen" title="Add Member" size="sm" (closed)="isAddMemberOpen = false">
      <form [formGroup]="memberForm" (ngSubmit)="addMember()" class="form">
        <app-input label="Email address" type="email" placeholder="colleague@example.com" formControlName="email"></app-input>
        <div class="form-actions">
          <app-button variant="secondary" size="sm" (click)="isAddMemberOpen = false">Cancel</app-button>
          <app-button type="submit" size="sm" [loading]="isAddingMember">Add</app-button>
        </div>
      </form>
    </app-modal>

    <!-- Create project modal -->
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
            <option *ngFor="let m of workspace?.members" [value]="m.id">{{ m.username }}</option>
          </select>
        </div>
        <div class="form-actions">
          <app-button variant="secondary" size="sm" (click)="isCreateProjectOpen = false">Cancel</app-button>
          <app-button type="submit" size="sm" [loading]="isCreatingProject">Create</app-button>
        </div>
      </form>
    </app-modal>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .workspace-detail { max-width: 1200px; }
    .ws-hero { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 16px; }
    .ws-info h1 { margin: 0 0 6px; font-size: 24px; font-weight: 700; }
    .ws-desc { color: var(--color-muted); margin: 0; font-size: 14px; }
    .ws-actions { display: flex; gap: 8px; flex-shrink: 0; }
    .members-strip { display: flex; align-items: center; gap: 4px; margin-bottom: 28px; }
    .more-members { font-size: 12px; color: var(--color-muted); margin-left: 4px; }
    .section h2 { margin: 0 0 16px; font-size: 18px; font-weight: 600; }
    .projects-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    @media (max-width: 1024px) { .projects-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 576px)  { .projects-grid { grid-template-columns: 1fr; } }
    .form { display: flex; flex-direction: column; gap: 16px; }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field-label { font-size: 13px; font-weight: 500; color: var(--color-muted); }
    .field-input {
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); color: var(--color-text); padding: 10px 14px; font-size: 14px; outline: none;
    }
    .field-input:focus { border-color: var(--color-accent); }
  `]
})
export default class WorkspaceDetailComponent implements OnInit {
  readonly workspaceService = inject(WorkspaceService);
  readonly projectService = inject(ProjectService);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  workspace: Workspace | null = null;
  projects: Project[] = [];
  isLoading = true;
  isAddMemberOpen = false;
  isCreateProjectOpen = false;
  isAddingMember = false;
  isCreatingProject = false;

  memberForm = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  projectForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    deadline: [''],
    managerId: ['']
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.workspaceService.getById(id).subscribe({
      next: ws => {
        this.workspace = ws;
        this.projectService.getByWorkspace(id).subscribe({
          next: ps => { this.projects = ps; this.isLoading = false; },
          error: () => { this.isLoading = false; }
        });
      },
      error: () => { this.isLoading = false; }
    });
  }

  addMember(): void {
    if (!this.memberForm.valid || !this.workspace) return;
    this.isAddingMember = true;
    this.workspaceService.addMember(this.workspace.id, this.memberForm.value.email!).subscribe({
      next: ws => {
        this.workspace = ws;
        this.isAddMemberOpen = false;
        this.memberForm.reset();
        this.isAddingMember = false;
      },
      error: () => { this.isAddingMember = false; }
    });
  }

  createProject(): void {
    if (!this.projectForm.valid || !this.workspace) return;
    this.isCreatingProject = true;
    const { title, description, deadline, managerId } = this.projectForm.value;
    this.projectService.create(this.workspace.id, {
      title: title!, description: description || '', deadline: deadline || '', managerId: managerId || ''
    }).subscribe({
      next: p => {
        this.projects = [p, ...this.projects];
        this.isCreateProjectOpen = false;
        this.projectForm.reset();
        this.isCreatingProject = false;
      },
      error: () => { this.isCreatingProject = false; }
    });
  }
}
