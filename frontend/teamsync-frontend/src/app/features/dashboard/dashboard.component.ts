import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { WorkspaceService } from '../../api/workspace.service';
import { Workspace } from '../../shared/models/workspace.model';
import { Task } from '../../shared/models/task.model';
import { StatsCardComponent } from './stats-card/stats-card.component';
import { WorkspaceCardComponent } from './workspace-card/workspace-card.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, DatePipe, ReactiveFormsModule,
    StatsCardComponent, WorkspaceCardComponent,
    ModalComponent, ButtonComponent, InputComponent, EmptyStateComponent,
    SpinnerComponent
  ],
  template: `
    <div class="dashboard">
      <!-- Greeting -->
      <div class="greeting">
        <h1>Good {{ timeOfDay }}, {{ (user$ | async)?.username }}</h1>
        <p class="date">{{ today | date:'EEEE, MMMM d' }}</p>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="loading-center">
        <app-spinner size="lg"></app-spinner>
      </div>

      <ng-container *ngIf="!isLoading">
        <!-- Stats row -->
        <div class="stats-grid">
          <app-stats-card icon="📋" label="Active Tasks"   [value]="activeTaskCount"  color="accent"></app-stats-card>
          <app-stats-card icon="📁" label="My Workspaces" [value]="workspaces.length" color="success"></app-stats-card>
          <app-stats-card icon="⏰" label="Due Today"     [value]="dueTodayCount"    color="warning"></app-stats-card>
          <app-stats-card icon="⚠️" label="Overdue"       [value]="overdueCount"      color="danger"></app-stats-card>
        </div>

        <!-- Workspaces -->
        <div class="section">
          <div class="section-header">
            <h2>My Workspaces</h2>
            <app-button variant="primary" size="sm" (click)="isCreateModalOpen = true">+ New</app-button>
          </div>
          <div class="workspace-row" *ngIf="workspaces.length; else noWorkspaces">
            <app-workspace-card
              *ngFor="let ws of workspaces"
              [workspace]="ws"
              (click)="router.navigate(['/workspaces', ws.id])">
            </app-workspace-card>
          </div>
          <ng-template #noWorkspaces>
            <app-empty-state
              icon="📁"
              title="No workspaces yet"
              description="Create your first workspace to get started"
              actionLabel="Create Workspace"
              (action)="isCreateModalOpen = true">
            </app-empty-state>
          </ng-template>
        </div>
      </ng-container>

      <!-- Create workspace modal -->
      <app-modal [isOpen]="isCreateModalOpen" title="New Workspace" (closed)="isCreateModalOpen = false">
        <form [formGroup]="workspaceForm" (ngSubmit)="createWorkspace()" class="modal-form">
          <app-input label="Name" placeholder="My Team Workspace" formControlName="name"></app-input>
          <app-input label="Description" placeholder="What is this workspace for?" formControlName="description"></app-input>
          <div class="modal-actions">
            <app-button variant="secondary" size="sm" (click)="isCreateModalOpen = false">Cancel</app-button>
            <app-button type="submit" size="sm" [loading]="isCreating">Create</app-button>
          </div>
        </form>
      </app-modal>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1200px; }
    .greeting { margin-bottom: 28px; }
    .greeting h1 { margin: 0 0 4px; font-size: 24px; font-weight: 700; }
    .date { color: var(--color-muted); margin: 0; font-size: 14px; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .stats-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 16px; margin-bottom: 32px;
    }
    @media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    .section { margin-bottom: 32px; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .section-header h2 { margin: 0; font-size: 18px; font-weight: 600; }
    .workspace-row { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px; }
    .modal-form { display: flex; flex-direction: column; gap: 16px; }
    .modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
  `]
})
export default class DashboardComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly workspaceService = inject(WorkspaceService);
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly user$ = this.authStore.user$;

  workspaces: Workspace[] = [];
  tasks: Task[] = [];
  isLoading = true;
  isCreating = false;
  isCreateModalOpen = false;

  workspaceForm = this.fb.group({
    name: ['', Validators.required],
    description: ['']
  });

  get today(): Date { return new Date(); }
  get timeOfDay(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
  }
  get activeTaskCount(): number { return this.tasks.filter(t => t.status === 'IN_PROGRESS').length; }
  get dueTodayCount(): number {
    const today = new Date().toISOString().slice(0, 10);
    return this.tasks.filter(t => t.dueDate === today).length;
  }
  get overdueCount(): number {
    const today = new Date().toISOString().slice(0, 10);
    return this.tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'DONE').length;
  }

  ngOnInit(): void {
    this.workspaceService.getAll().subscribe({
      next: ws => { this.workspaces = ws; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  createWorkspace(): void {
    if (this.workspaceForm.invalid) return;
    this.isCreating = true;
    const { name, description } = this.workspaceForm.value;
    this.workspaceService.create({ name: name!, description: description || '' }).subscribe({
      next: ws => {
        this.workspaces = [ws, ...this.workspaces];
        this.isCreateModalOpen = false;
        this.workspaceForm.reset();
        this.isCreating = false;
      },
      error: () => { this.isCreating = false; }
    });
  }
}
