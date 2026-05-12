import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkspaceService } from '../../../api/workspace.service';
import { Workspace } from '../../../shared/models/workspace.model';

@Component({
  selector: 'app-workspace-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="workspaces-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1>Workspaces</h1>
          <span class="count-badge">{{ workspaces.length }}</span>
        </div>
        <button class="new-btn" (click)="isCreateOpen = true" type="button">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z"/></svg>
          New Workspace
        </button>
      </header>

      <!-- Loading skeleton -->
      <div class="skeleton-grid" *ngIf="isLoading">
        <div class="skeleton-card" *ngFor="let i of [1,2,3,4,5,6]">
          <div class="sk sk-title"></div>
          <div class="sk sk-line"></div>
          <div class="sk sk-line short"></div>
          <div class="sk sk-footer"></div>
        </div>
      </div>

      <!-- Error -->
      <div class="error-state" *ngIf="!isLoading && hasError">
        <div class="error-icon">⚠</div>
        <p>Failed to load workspaces</p>
        <button class="retry-btn" (click)="load()" type="button">Try again</button>
      </div>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!isLoading && !hasError && !workspaces.length">
        <div class="empty-icon">▣</div>
        <p>No workspaces yet</p>
        <span>Create your first workspace to start collaborating.</span>
        <button class="new-btn" (click)="isCreateOpen = true" type="button">Create Workspace</button>
      </div>

      <!-- Grid -->
      <div class="workspace-grid" *ngIf="!isLoading && !hasError && workspaces.length">
        <article
          class="workspace-card"
          *ngFor="let ws of workspaces"
          (click)="router.navigate(['/workspaces', ws.id])"
          tabindex="0"
          (keydown.enter)="router.navigate(['/workspaces', ws.id])"
        >
          <!-- Card top: icon + name -->
          <div class="card-top">
            <div class="ws-icon">{{ ws.name.charAt(0).toUpperCase() }}</div>
            <div class="ws-title-block">
              <h2>{{ ws.name }}</h2>
              <span class="ws-workspace-label">Workspace</span>
            </div>
          </div>

          <!-- Description -->
          <p class="ws-desc">{{ ws.description || 'No description provided.' }}</p>

          <!-- Stats row -->
          <div class="ws-stats">
            <div class="stat-item">
              <span class="stat-num">{{ ws.members?.length ?? 0 }}</span>
              <span class="stat-label">Members</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num">—</span>
              <span class="stat-label">Projects</span>
            </div>
          </div>

          <!-- Footer: owner + open -->
          <div class="card-footer">
            <div class="owner-row">
              <div class="owner-avatar">{{ ws.owner?.username?.charAt(0)?.toUpperCase() ?? '?' }}</div>
              <span class="owner-name">{{ ws.owner?.username ?? 'Unknown' }}</span>
            </div>
            <button class="open-btn" type="button"
              (click)="$event.stopPropagation(); router.navigate(['/workspaces', ws.id])">
              Open →
            </button>
          </div>
        </article>
      </div>
    </div>

    <!-- Create modal -->
    <div class="modal-overlay" *ngIf="isCreateOpen" (click)="isCreateOpen = false">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>New Workspace</h3>
          <button class="modal-close" (click)="isCreateOpen = false" type="button">✕</button>
        </div>
        <form [formGroup]="form" (ngSubmit)="create()" class="modal-form">
          <div class="field-group">
            <label>Name</label>
            <input class="field-input" type="text" placeholder="My Team Workspace" formControlName="name" />
          </div>
          <div class="field-group">
            <label>Description</label>
            <input class="field-input" type="text" placeholder="What is this workspace for?" formControlName="description" />
          </div>
          <div class="modal-actions">
            <button class="cancel-btn" type="button" (click)="isCreateOpen = false">Cancel</button>
            <button class="submit-btn" type="submit" [disabled]="form.invalid || isCreating">
              {{ isCreating ? 'Creating…' : 'Create Workspace' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .workspaces-page {
      min-height: 100%;
      padding: 32px;
      background: var(--bg-base);
      color: var(--text-primary);
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
      gap: 16px;
    }

    .header-left { display: flex; align-items: center; gap: 12px; }

    h1 { font-size: 24px; font-weight: 600; }

    .count-badge {
      height: 22px; padding: 0 8px;
      border-radius: var(--radius-full);
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      font-size: 12px; color: var(--text-secondary);
      display: inline-flex; align-items: center;
    }

    .new-btn {
      height: 36px; padding: 0 16px;
      border: none; border-radius: var(--radius-md);
      background: var(--accent); color: #0c0c0e;
      font-size: 13px; font-weight: 600;
      cursor: pointer; display: inline-flex; align-items: center; gap: 7px;
      transition: background 0.15s;
    }
    .new-btn:hover { background: var(--accent-hover); }

    /* Skeleton */
    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    .skeleton-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex; flex-direction: column; gap: 12px;
    }
    .sk {
      background: var(--bg-elevated);
      border-radius: 4px;
      animation: shimmer 1.5s ease-in-out infinite alternate;
    }
    .sk-title { height: 18px; width: 55%; }
    .sk-line { height: 12px; }
    .sk-line.short { width: 60%; }
    .sk-footer { height: 32px; margin-top: 8px; }
    @keyframes shimmer { from { opacity: 0.5; } to { opacity: 1; } }

    /* Error */
    .error-state {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 80px 0; color: var(--text-secondary);
    }
    .error-icon { font-size: 36px; color: var(--danger); }
    .error-state p { font-size: 15px; color: var(--text-primary); }
    .retry-btn {
      height: 32px; padding: 0 16px;
      border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
      background: transparent; color: var(--text-secondary);
      font-size: 13px; cursor: pointer; transition: all 0.15s;
    }
    .retry-btn:hover { border-color: var(--accent); color: var(--accent); }

    /* Empty */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 80px 0; color: var(--text-secondary);
    }
    .empty-icon { font-size: 40px; opacity: 0.3; margin-bottom: 8px; }
    .empty-state p { font-size: 16px; color: var(--text-primary); }
    .empty-state span { font-size: 13px; margin-bottom: 8px; }

    /* Grid */
    .workspace-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .workspace-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px;
      cursor: pointer;
      display: flex; flex-direction: column; gap: 14px;
      transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
    }
    .workspace-card:hover {
      border-color: var(--border-default);
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }

    .card-top { display: flex; align-items: center; gap: 12px; }

    .ws-icon {
      width: 44px; height: 44px;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, var(--accent), #8b5cf6);
      color: #fff;
      font-size: 18px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .ws-title-block { min-width: 0; }

    h2 {
      font-size: 15px; font-weight: 600;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-bottom: 2px;
    }

    .ws-workspace-label { font-size: 11px; color: var(--text-tertiary); }

    .ws-desc {
      font-size: 13px; color: var(--text-secondary); line-height: 1.5;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }

    .ws-stats {
      display: flex; align-items: center; gap: 16px;
      padding: 12px 0;
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
    }

    .stat-item { display: flex; flex-direction: column; gap: 2px; }
    .stat-num { font-size: 18px; font-weight: 600; color: var(--text-primary); }
    .stat-label { font-size: 11px; color: var(--text-tertiary); }
    .stat-divider { width: 1px; height: 28px; background: var(--border-subtle); }

    .card-footer { display: flex; align-items: center; justify-content: space-between; }

    .owner-row { display: flex; align-items: center; gap: 8px; }
    .owner-avatar {
      width: 26px; height: 26px; border-radius: 50%;
      background: linear-gradient(135deg, #c18c60, #2f5874);
      color: #fff; font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .owner-name { font-size: 12px; color: var(--text-secondary); }

    .open-btn {
      height: 28px; padding: 0 12px;
      border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
      background: transparent; color: var(--accent);
      font-size: 12px; cursor: pointer; transition: all 0.15s;
    }
    .open-btn:hover { background: var(--accent-dim); border-color: var(--accent); }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center;
      z-index: 400;
    }
    .modal-box {
      width: 100%; max-width: 440px;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-xl);
      padding: 24px;
      box-shadow: var(--shadow-lg);
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px;
    }
    .modal-header h3 { font-size: 16px; font-weight: 600; }
    .modal-close {
      width: 28px; height: 28px; border: none;
      border-radius: var(--radius-md); background: transparent;
      color: var(--text-tertiary); cursor: pointer; font-size: 14px;
      transition: background 0.15s;
    }
    .modal-close:hover { background: var(--bg-elevated); color: var(--text-primary); }
    .modal-form { display: flex; flex-direction: column; gap: 16px; }
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-group label { font-size: 12px; font-weight: 500; color: var(--text-secondary); }
    .field-input {
      height: 38px; padding: 0 12px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      color: var(--text-primary); font-size: 13px; outline: none;
      transition: border-color 0.15s;
    }
    .field-input:focus { border-color: var(--border-default); }
    .field-input::placeholder { color: var(--text-tertiary); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
    .cancel-btn {
      height: 36px; padding: 0 16px;
      border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
      background: transparent; color: var(--text-secondary);
      font-size: 13px; cursor: pointer; transition: all 0.15s;
    }
    .cancel-btn:hover { border-color: var(--border-default); color: var(--text-primary); }
    .submit-btn {
      height: 36px; padding: 0 20px;
      border: none; border-radius: var(--radius-md);
      background: var(--accent); color: #0c0c0e;
      font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s;
    }
    .submit-btn:hover:not(:disabled) { background: var(--accent-hover); }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export default class WorkspaceListComponent implements OnInit {
  readonly workspaceService = inject(WorkspaceService);
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  workspaces: Workspace[] = [];
  isLoading = true;
  hasError = false;
  isCreateOpen = false;
  isCreating = false;

  form = this.fb.group({
    name: ['', Validators.required],
    description: ['']
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.hasError = false;
    this.workspaceService.getAll().subscribe({
      next: ws => { this.workspaces = ws; this.isLoading = false; },
      error: () => { this.hasError = true; this.isLoading = false; }
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
