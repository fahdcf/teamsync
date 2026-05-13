import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkspaceService } from '../../../api/workspace.service';
import { Workspace } from '../../../shared/models/workspace.model';
import { User } from '../../../shared/models/user.model';

interface WorkspaceActivityItem {
  label: string;
  user: User | null;
}

@Component({
  selector: 'app-workspace-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="workspaces-page">
      <section class="workspace-hero-shell">
        <div class="hero-copy">
          <div class="hero-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.5 21 7.2 12 12 3 7.2 12 2.5Z"></path>
              <path d="m5.4 10.3 6.6 3.5 6.6-3.5 2.4 1.3-9 4.8-9-4.8 2.4-1.3Z" opacity="0.72"></path>
              <path d="m5.4 14.9 6.6 3.5 6.6-3.5 2.4 1.3-9 4.8-9-4.8 2.4-1.3Z" opacity="0.46"></path>
            </svg>
          </div>
          <div>
            <h1>Workspaces</h1>
            <p>Manage collaborative environments, projects, and team activity.</p>
          </div>
        </div>

        <button class="new-workspace-btn" (click)="isCreateOpen = true" type="button">
          <span aria-hidden="true">+</span>
          New Workspace
        </button>
      </section>

      <div class="skeleton-shell" *ngIf="isLoading">
        <div class="skeleton-feature"></div>
        <div class="skeleton-side"></div>
      </div>

      <section class="error-state" *ngIf="!isLoading && hasError">
        <div class="state-icon">!</div>
        <h2>Failed to load workspaces</h2>
        <p>The workspace overview could not be loaded. Try again and we will give it another run.</p>
        <button class="retry-btn" (click)="load()" type="button">Try again</button>
      </section>

      <section class="empty-state" *ngIf="!isLoading && !hasError && !workspaces.length">
        <div class="state-icon">+</div>
        <h2>No workspaces yet</h2>
        <p>Create your first collaborative environment to start organizing projects, tasks, and team activity.</p>
        <button class="new-workspace-btn" (click)="isCreateOpen = true" type="button">New Workspace</button>
      </section>

      <section class="workspace-dashboard" *ngIf="!isLoading && !hasError && primaryWorkspace as ws">
        <article class="workspace-feature-card">
          <div class="card-glow"></div>
          <div class="card-wave"></div>

          <header class="workspace-card-header">
            <div class="identity-row">
              <div class="workspace-avatar">{{ firstLetter(ws.name) }}</div>
              <div>
                <h2>{{ ws.name }}</h2>
                <span>Workspace</span>
              </div>
            </div>

            <div class="workspace-card-actions">
              <button class="open-btn" type="button" (click)="openWorkspace(ws.id)">Open -></button>
              <button class="ghost-icon-btn" type="button" aria-label="Workspace options">...</button>
            </div>
          </header>

          <p class="workspace-description">{{ ws.description || 'No description provided.' }}</p>

          <div class="feature-content-grid">
            <div class="feature-left">
              <div class="workspace-stats-row">
                <div>
                  <strong>{{ memberCount(ws) }}</strong>
                  <span>Members</span>
                </div>
                <i></i>
                <div>
                  <strong>-</strong>
                  <span>Projects</span>
                </div>
              </div>

              <section class="collaborator-section">
                <h3>Active Collaborator</h3>
                <div class="collaborator-row">
                  <div class="person-avatar">{{ initials(ws.owner) }}</div>
                  <div>
                    <strong>{{ ws.owner.username }}</strong>
                    <span>Online</span>
                  </div>
                </div>
              </section>

              <section class="activity-section">
                <h3>Recent Activity</h3>
                <div class="activity-row" *ngFor="let activity of activityRows(ws)">
                  <div class="mini-avatar">{{ initials(activity.user) }}</div>
                  <span>{{ activity.label }}</span>
                  <time>Just now</time>
                </div>
              </section>
            </div>

            <div class="feature-right">
              <section class="progress-panel">
                <h3>Workspace Progress</h3>
                <div class="progress-content">
                  <div class="progress-ring" aria-label="Workspace progress 0 percent">
                    <svg viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="45"></circle>
                      <circle cx="60" cy="60" r="45"></circle>
                    </svg>
                    <strong>0%</strong>
                  </div>
                  <div class="progress-legend">
                    <span><i class="ok"></i> On Track <b>0</b></span>
                    <span><i class="warn"></i> At Risk <b>0</b></span>
                    <span><i class="bad"></i> Overdue <b>0</b></span>
                  </div>
                </div>
              </section>

              <section class="health-panel">
                <h3>Workspace Health</h3>
                <div class="health-row">
                  <span class="health-icon">~</span>
                  <strong>Activity</strong>
                  <em class="low">Low</em>
                </div>
                <div class="health-row">
                  <span class="health-icon">oo</span>
                  <strong>Engagement</strong>
                  <em class="low">Low</em>
                </div>
                <div class="health-row">
                  <span class="health-icon">o</span>
                  <strong>Progress</strong>
                  <em class="none">No data</em>
                </div>
              </section>
            </div>
          </div>
        </article>

        <aside class="workspace-side-panel">
          <article class="side-card overview-card">
            <header>
              <span class="side-icon bars" aria-hidden="true"></span>
              <h2>Workspace Overview</h2>
            </header>

            <div class="overview-metric">
              <span class="metric-icon projects" aria-hidden="true"></span>
              <div>
                <small>Total Projects</small>
                <strong>-</strong>
              </div>
            </div>

            <div class="overview-metric">
              <span class="metric-icon tasks" aria-hidden="true"></span>
              <div>
                <small>Active Tasks</small>
                <strong>0</strong>
              </div>
            </div>

            <div class="overview-metric">
              <span class="metric-icon members" aria-hidden="true"></span>
              <div>
                <small>Team Members</small>
                <strong>{{ totalMembers }}</strong>
              </div>
            </div>
          </article>

          <article class="side-card insight-card">
            <header>
              <span class="spark-icon" aria-hidden="true">*</span>
              <h2>AI Insight</h2>
            </header>
            <p>Start adding projects and tasks to get AI-powered insights about your team's productivity.</p>
            <div class="wire-grid" aria-hidden="true"></div>
          </article>
        </aside>
      </section>
    </div>

    <div class="modal-overlay" *ngIf="isCreateOpen" (click)="isCreateOpen = false">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>New Workspace</h3>
          <button class="modal-close" (click)="isCreateOpen = false" type="button" aria-label="Close">x</button>
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
              {{ isCreating ? 'Creating...' : 'Create Workspace' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .workspaces-page {
      min-height: 100%;
      padding: 54px 40px 64px;
      color: var(--text-primary);
      background:
        radial-gradient(circle at 18% 8%, rgba(212, 168, 83, 0.13), transparent 24%),
        radial-gradient(circle at 62% 4%, rgba(80, 105, 150, 0.12), transparent 30%),
        var(--bg-base);
      overflow: hidden;
      position: relative;
    }

    .workspace-hero-shell,
    .workspace-dashboard,
    .skeleton-shell,
    .error-state,
    .empty-state {
      position: relative;
      z-index: 1;
      max-width: 1216px;
      margin: 0 auto;
    }

    .workspace-hero-shell {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 58px;
    }

    .hero-copy {
      display: flex;
      align-items: center;
      gap: 28px;
    }

    .hero-icon {
      width: 68px;
      height: 68px;
      border: 1px solid var(--border-default);
      border-radius: var(--radius-xl);
      display: grid;
      place-items: center;
      background: linear-gradient(145deg, rgba(212,168,83,0.08), rgba(255,255,255,0.02));
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
      color: #e6dccb;
    }

    .hero-icon svg {
      width: 34px;
      height: 34px;
      filter: drop-shadow(0 8px 20px rgba(212,168,83,0.28));
    }

    h1 {
      font-size: clamp(34px, 3.4vw, 44px);
      line-height: 1;
      letter-spacing: -0.04em;
      font-weight: 650;
      margin: 0 0 14px;
    }

    .hero-copy p {
      color: var(--text-secondary);
      font-size: 15px;
      margin: 0;
    }

    .new-workspace-btn {
      height: 42px;
      padding: 0 18px;
      border: 1px solid rgba(245, 190, 88, 0.5);
      border-radius: var(--radius-md);
      background: linear-gradient(180deg, #efc96e, #d7a748);
      color: #14100a;
      font-size: 14px;
      font-weight: 650;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 28px rgba(212,168,83,0.16), inset 0 1px 0 rgba(255,255,255,0.35);
    }

    .new-workspace-btn span {
      font-size: 22px;
      line-height: 0;
      margin-top: -2px;
    }

    .workspace-dashboard {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 368px;
      gap: 24px;
      align-items: stretch;
    }

    .workspace-feature-card,
    .side-card,
    .modal-box,
    .modal-box {
      border: 1px solid var(--border-default);
      border-radius: var(--radius-xl);
      background: linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012)), var(--bg-surface);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), 0 18px 50px rgba(0,0,0,0.28);
    }

    .workspace-feature-card {
      min-height: 690px;
      padding: 32px 38px 34px;
      overflow: hidden;
      position: relative;
    }

    .card-glow {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(ellipse 72% 44% at 9% 4%, rgba(211, 160, 87, 0.34), transparent 64%),
        radial-gradient(ellipse 50% 36% at 38% 16%, rgba(240, 210, 160, 0.16), transparent 64%);
      opacity: 0.88;
    }

    .card-wave {
      position: absolute;
      left: -12%;
      right: -4%;
      bottom: -92px;
      height: 168px;
      opacity: 0.44;
      pointer-events: none;
      background:
        repeating-radial-gradient(ellipse at 50% 120%, transparent 0 11px, rgba(212,168,83,0.2) 12px 13px, transparent 14px 24px);
      transform: rotate(2deg);
    }

    .workspace-card-header,
    .identity-row,
    .workspace-card-actions,
    .collaborator-row,
    .activity-row,
    .side-card header,
    .overview-metric,
    .health-row {
      display: flex;
      align-items: center;
    }

    .workspace-card-header {
      position: relative;
      justify-content: space-between;
      gap: 24px;
      z-index: 1;
    }

    .identity-row {
      gap: 26px;
    }

    .workspace-avatar {
      width: 78px;
      height: 78px;
      border-radius: 13px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #f0bd76 0%, #a95ce4 58%, #6559ff 100%);
      color: #fff;
      font-size: 32px;
      font-weight: 800;
      box-shadow: 0 18px 40px rgba(123, 88, 255, 0.28);
    }

    .identity-row h2 {
      margin: 0 0 7px;
      font-size: 28px;
      line-height: 1;
      letter-spacing: -0.03em;
      font-weight: 650;
    }

    .identity-row span,
    .workspace-description,
    .workspace-stats-row span,
    .activity-row span,
    .activity-row time,
    .side-card p,
    .overview-metric small {
      color: var(--text-secondary);
    }

    .workspace-card-actions {
      gap: 14px;
      align-self: flex-start;
    }

    .open-btn,
    .ghost-icon-btn,
    .retry-btn,
    .cancel-btn,
    .submit-btn {
      height: 42px;
      border-radius: var(--radius-md);
      font: inherit;
      cursor: pointer;
    }

    .open-btn {
      padding: 0 20px;
      border: 1px solid var(--border-default);
      background: rgba(255,255,255,0.02);
      color: var(--accent);
      font-size: 14px;
      font-weight: 650;
    }

    .ghost-icon-btn {
      width: 42px;
      border: none;
      background: transparent;
      color: var(--text-primary);
      font-size: 20px;
      letter-spacing: 2px;
    }

    .workspace-description {
      position: relative;
      z-index: 1;
      margin: 26px 0 30px;
      max-width: 440px;
      font-size: 14px;
      line-height: 1.6;
    }

    .feature-content-grid {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 316px;
      gap: 44px;
      margin-top: 22px;
    }

    .workspace-stats-row {
      display: flex;
      align-items: center;
      gap: 28px;
      padding-bottom: 22px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .workspace-stats-row strong {
      display: block;
      font-size: 24px;
      line-height: 1;
      margin-bottom: 8px;
    }

    .workspace-stats-row span {
      font-size: 13px;
    }

    .workspace-stats-row i {
      width: 1px;
      height: 40px;
      background: var(--border-subtle);
    }

    .collaborator-section,
    .activity-section {
      padding: 22px 0 24px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .activity-section {
      border-bottom: none;
    }

    .collaborator-section h3,
    .activity-section h3,
    .progress-panel h3,
    .health-panel h3 {
      margin: 0 0 16px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .collaborator-row {
      gap: 12px;
    }

    .person-avatar,
    .mini-avatar {
      border-radius: var(--radius-full);
      display: grid;
      place-items: center;
      background: radial-gradient(circle at 28% 18%, #f1d29d, #7d8792 64%, #2a3c40);
      color: #fff;
      font-weight: 700;
      position: relative;
    }

    .person-avatar {
      width: 44px;
      height: 44px;
      font-size: 16px;
    }

    .person-avatar::after,
    .mini-avatar::after {
      content: '';
      position: absolute;
      right: 0;
      bottom: 2px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 2px solid var(--bg-surface);
      background: var(--success);
    }

    .collaborator-row strong {
      display: block;
      font-size: 14px;
    }

    .collaborator-row span {
      color: var(--text-secondary);
      font-size: 12px;
    }

    .activity-row {
      min-height: 42px;
      gap: 10px;
      margin-bottom: 7px;
    }

    .mini-avatar {
      width: 32px;
      height: 32px;
      font-size: 12px;
      flex: 0 0 auto;
    }

    .activity-row span {
      min-width: 0;
      flex: 1;
      font-size: 13px;
    }

    .activity-row time {
      font-size: 12px;
    }

    .feature-right {
      padding-top: 46px;
    }

    .progress-panel,
    .health-panel {
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      background: rgba(12,12,14,0.22);
    }

    .progress-panel {
      padding: 22px 18px 18px;
    }

    .progress-content {
      display: grid;
      grid-template-columns: 110px 1fr;
      align-items: center;
      gap: 18px;
    }

    .progress-ring {
      position: relative;
      width: 100px;
      height: 100px;
      display: grid;
      place-items: center;
    }

    .progress-ring svg {
      position: absolute;
      inset: 0;
      transform: rotate(-90deg);
    }

    .progress-ring circle {
      fill: none;
      stroke-width: 10;
      stroke: var(--bg-elevated);
    }

    .progress-ring circle:last-child {
      stroke: var(--success);
      stroke-dasharray: 3 283;
      stroke-linecap: round;
    }

    .progress-ring strong {
      font-size: 25px;
    }

    .progress-legend {
      display: grid;
      gap: 18px;
      font-size: 13px;
    }

    .progress-legend span {
      display: grid;
      grid-template-columns: 10px 1fr 18px;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);
    }

    .progress-legend i,
    .side-icon.bars,
    .health-row em::before {
      border-radius: var(--radius-full);
    }

    .progress-legend i {
      width: 8px;
      height: 8px;
    }

    .progress-legend .ok { background: var(--success); }
    .progress-legend .warn { background: var(--warning); }
    .progress-legend .bad { background: #f56f51; }

    .progress-legend b {
      color: var(--text-secondary);
      font-weight: 400;
      text-align: right;
    }

    .health-panel {
      margin-top: 20px;
      padding: 20px 16px 10px;
    }

    .health-row {
      min-height: 52px;
      gap: 14px;
      border-top: 1px solid var(--border-subtle);
    }

    .health-row:first-of-type {
      border-top: none;
    }

    .health-icon {
      width: 24px;
      color: var(--text-secondary);
      font-size: 15px;
      text-align: center;
    }

    .health-row strong {
      flex: 1;
      font-size: 13px;
      font-weight: 600;
    }

    .health-row em {
      color: var(--text-secondary);
      font-style: normal;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 7px;
    }

    .health-row em::before {
      content: '';
      width: 6px;
      height: 6px;
      background: var(--success);
    }

    .health-row em.none {
      color: var(--warning);
    }

    .health-row em.none::before {
      background: var(--warning);
    }

    .workspace-side-panel {
      display: grid;
      grid-template-rows: 360px 1fr;
      gap: 24px;
    }

    .side-card {
      padding: 28px 24px;
      overflow: hidden;
      position: relative;
    }

    .side-card header {
      gap: 12px;
      margin-bottom: 26px;
    }

    .side-card h2 {
      font-size: 15px;
      font-weight: 650;
      margin: 0;
    }

    .side-icon.bars {
      width: 18px;
      height: 18px;
      background:
        linear-gradient(to top, var(--accent) 0 72%, transparent 72%) 1px 0 / 3px 100% no-repeat,
        linear-gradient(to top, var(--accent) 0 92%, transparent 92%) 7px 0 / 3px 100% no-repeat,
        linear-gradient(to top, var(--accent) 0 48%, transparent 48%) 13px 0 / 3px 100% no-repeat;
    }

    .overview-card {
      display: flex;
      flex-direction: column;
    }

    .overview-metric {
      min-height: 74px;
      padding: 14px;
      margin-bottom: 14px;
      gap: 18px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      background: linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015));
    }

    .metric-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      position: relative;
    }

    .metric-icon::before {
      font-size: 18px;
      font-weight: 700;
    }

    .metric-icon.projects {
      background: rgba(74, 222, 128, 0.13);
      color: var(--success);
    }

    .metric-icon.projects::before { content: '[]'; }

    .metric-icon.tasks {
      background: rgba(212,168,83,0.16);
      color: var(--accent);
    }

    .metric-icon.tasks::before { content: '##'; font-size: 13px; letter-spacing: -2px; }

    .metric-icon.members {
      background: rgba(239, 93, 68, 0.14);
      color: #ff7c62;
    }

    .metric-icon.members::before { content: 'oo'; }

    .overview-metric small {
      display: block;
      margin-bottom: 7px;
      font-size: 12px;
    }

    .overview-metric strong {
      font-size: 24px;
      line-height: 1;
    }

    .insight-card {
      min-height: 304px;
    }

    .spark-icon {
      color: var(--accent);
      font-size: 22px;
    }

    .side-card p {
      max-width: 280px;
      line-height: 1.6;
      font-size: 15px;
    }

    .wire-grid {
      position: absolute;
      right: -70px;
      bottom: -80px;
      width: 330px;
      height: 190px;
      opacity: 0.32;
      background: repeating-radial-gradient(ellipse at 10% 100%, transparent 0 12px, rgba(212,168,83,0.35) 13px 14px, transparent 15px 25px);
      transform: rotate(-14deg);
    }

    .skeleton-shell {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 368px;
      gap: 24px;
    }

    .skeleton-feature,
    .skeleton-side {
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      background: linear-gradient(90deg, var(--bg-surface), var(--bg-elevated), var(--bg-surface));
      background-size: 240% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }

    .skeleton-feature { height: 690px; }
    .skeleton-side { height: 360px; }

    @keyframes shimmer {
      from { background-position: 0% 0; }
      to { background-position: 240% 0; }
    }

    .error-state,
    .empty-state {
      min-height: 420px;
      border: 1px solid var(--border-default);
      border-radius: var(--radius-xl);
      background: var(--bg-surface);
      display: grid;
      place-items: center;
      text-align: center;
      padding: 56px 24px;
    }

    .state-icon {
      width: 58px;
      height: 58px;
      border-radius: var(--radius-xl);
      margin: 0 auto 16px;
      display: grid;
      place-items: center;
      background: var(--accent-dim);
      color: var(--accent);
      font-size: 24px;
      font-weight: 700;
    }

    .error-state h2,
    .empty-state h2 {
      font-size: 24px;
      margin-bottom: 10px;
    }

    .error-state p,
    .empty-state p {
      max-width: 460px;
      margin-bottom: 22px;
      color: var(--text-secondary);
    }

    .retry-btn {
      padding: 0 18px;
      border: 1px solid var(--border-default);
      background: var(--bg-elevated);
      color: var(--text-primary);
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.62);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 400;
    }

    .modal-box {
      width: min(440px, calc(100vw - 32px));
      padding: 24px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .modal-header h3 {
      font-size: 17px;
      margin: 0;
    }

    .modal-close {
      width: 30px;
      height: 30px;
      border: none;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-tertiary);
    }

    .modal-close:hover {
      background: var(--bg-elevated);
      color: var(--text-primary);
    }

    .modal-form,
    .field-group {
      display: flex;
      flex-direction: column;
    }

    .modal-form { gap: 16px; }
    .field-group { gap: 7px; }

    .field-group label {
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 600;
    }

    .field-input {
      height: 40px;
      padding: 0 12px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      color: var(--text-primary);
      outline: none;
    }

    .field-input:focus {
      border-color: var(--accent);
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 4px;
    }

    .cancel-btn,
    .submit-btn {
      padding: 0 18px;
      border: 1px solid var(--border-default);
    }

    .cancel-btn {
      background: transparent;
      color: var(--text-secondary);
    }

    .submit-btn {
      background: var(--accent);
      color: #12100c;
      font-weight: 700;
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 1180px) {
      .workspace-dashboard,
      .skeleton-shell {
        grid-template-columns: 1fr;
      }

      .workspace-side-panel {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: auto;
      }
    }

    @media (max-width: 820px) {
      .workspaces-page {
        padding: 32px 18px 48px;
      }

      .workspace-hero-shell,
      .workspace-card-header,
      .feature-content-grid,
      .workspace-side-panel {
        grid-template-columns: 1fr;
        flex-direction: column;
        align-items: stretch;
      }

      .hero-copy {
        align-items: flex-start;
      }

      .feature-content-grid {
        gap: 22px;
      }

      .workspace-feature-card {
        min-height: auto;
        padding: 24px;
      }

      .identity-row {
        gap: 16px;
      }

      .workspace-avatar {
        width: 62px;
        height: 62px;
      }

      .feature-right {
        padding-top: 0;
      }
    }
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

  get primaryWorkspace(): Workspace | null {
    return this.workspaces[0] ?? null;
  }

  get totalMembers(): number {
    const memberIds = new Set<string>();
    this.workspaces.forEach((workspace) => {
      workspace.members.forEach((member) => memberIds.add(member.id));
      if (workspace.owner) memberIds.add(workspace.owner.id);
    });
    return memberIds.size;
  }

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

  openWorkspace(id: string): void {
    this.router.navigate(['/workspaces', id]);
  }

  firstLetter(value: string): string {
    return (value || 'W').charAt(0).toUpperCase();
  }

  initials(user: User | null): string {
    if (!user?.username) return '?';
    return user.username
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  memberCount(workspace: Workspace): number {
    const ids = new Set(workspace.members.map((member) => member.id));
    if (workspace.owner) ids.add(workspace.owner.id);
    return ids.size;
  }

  activityRows(workspace: Workspace): WorkspaceActivityItem[] {
    return [
      { user: workspace.owner, label: `${workspace.owner.username} joined this workspace` },
      { user: workspace.owner, label: `${workspace.owner.username} created this workspace` },
      { user: workspace.owner, label: `${workspace.owner.username} updated workspace details` },
    ];
  }
}
