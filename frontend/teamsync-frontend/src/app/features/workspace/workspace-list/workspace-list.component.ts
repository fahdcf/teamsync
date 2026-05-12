import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkspaceService } from '../../../api/workspace.service';
import { Workspace } from '../../../shared/models/workspace.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-workspace-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    AvatarComponent, BadgeComponent, ButtonComponent, InputComponent,
    ModalComponent, EmptyStateComponent, SpinnerComponent, TruncatePipe
  ],
  template: `
    <div class="workspace-list">
      <div class="page-header">
        <h1>Workspaces</h1>
        <app-button (click)="isCreateOpen = true">+ New Workspace</app-button>
      </div>

      <div *ngIf="isLoading" class="loading-center">
        <app-spinner size="lg"></app-spinner>
      </div>

      <div *ngIf="!isLoading && workspaces.length" class="workspace-grid">
        <div *ngFor="let ws of workspaces" class="workspace-card" (click)="router.navigate(['/workspaces', ws.id])">
          <div class="ws-header">
            <h3>{{ ws.name }}</h3>
            <app-badge [text]="ws.members.length + ' members'" variant="info"></app-badge>
          </div>
          <p class="ws-desc">{{ ws.description | truncate:80 }}</p>
          <div class="ws-footer">
            <app-avatar [user]="ws.owner" size="sm"></app-avatar>
            <span class="owner-name">{{ ws.owner.username }}</span>
            <app-button variant="ghost" size="sm">Open →</app-button>
          </div>
        </div>
      </div>

      <app-empty-state
        *ngIf="!isLoading && !workspaces.length"
        icon="📁"
        title="No workspaces yet"
        description="Create your first workspace to start collaborating"
        actionLabel="Create Workspace"
        (action)="isCreateOpen = true">
      </app-empty-state>
    </div>

    <app-modal [isOpen]="isCreateOpen" title="New Workspace" (closed)="isCreateOpen = false">
      <form [formGroup]="form" (ngSubmit)="create()" class="form">
        <app-input label="Name" placeholder="My Team Workspace" formControlName="name"></app-input>
        <app-input label="Description" placeholder="What is this workspace for?" formControlName="description"></app-input>
        <div class="form-actions">
          <app-button variant="secondary" size="sm" (click)="isCreateOpen = false">Cancel</app-button>
          <app-button type="submit" size="sm" [loading]="isCreating">Create</app-button>
        </div>
      </form>
    </app-modal>
  `,
  styles: [`
    .workspace-list { max-width: 1200px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .workspace-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
    }
    @media (max-width: 1024px) { .workspace-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 576px)  { .workspace-grid { grid-template-columns: 1fr; } }
    .workspace-card {
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); padding: 20px; cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .workspace-card:hover { border-color: var(--color-accent); box-shadow: var(--shadow-md); }
    .ws-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; gap: 8px; }
    .ws-header h3 { margin: 0; font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ws-desc { color: var(--color-muted); font-size: 13px; margin: 0 0 16px; }
    .ws-footer { display: flex; align-items: center; gap: 8px; }
    .owner-name { font-size: 12px; color: var(--color-muted); flex: 1; }
    .form { display: flex; flex-direction: column; gap: 16px; }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
  `]
})
export default class WorkspaceListComponent implements OnInit {
  readonly workspaceService = inject(WorkspaceService);
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  workspaces: Workspace[] = [];
  isLoading = true;
  isCreateOpen = false;
  isCreating = false;

  form = this.fb.group({
    name: ['', Validators.required],
    description: ['']
  });

  ngOnInit(): void {
    this.workspaceService.getAll().subscribe({
      next: ws => { this.workspaces = ws; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  create(): void {
    if (this.form.invalid) return;
    this.isCreating = true;
    const { name, description } = this.form.value;
    this.workspaceService.create({ name: name!, description: description || '' }).subscribe({
      next: ws => {
        this.workspaces = [ws, ...this.workspaces];
        this.isCreateOpen = false;
        this.form.reset();
        this.isCreating = false;
      },
      error: () => { this.isCreating = false; }
    });
  }
}
