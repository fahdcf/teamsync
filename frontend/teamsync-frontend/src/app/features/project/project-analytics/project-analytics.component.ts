import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../../api/analytics.service';
import { ProjectStats, TeamWorkload, ProjectHealth } from '../../../shared/models/analytics.model';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-project-analytics',
  standalone: true,
  imports: [CommonModule, BadgeComponent, AvatarComponent, SpinnerComponent],
  template: `
    <div *ngIf="isLoading" class="loading">
      <app-spinner size="md"></app-spinner>
    </div>

    <div *ngIf="!isLoading && stats" class="analytics">
      <!-- Health -->
      <div class="health-row">
        <span class="health-label">Project Health</span>
        <app-badge [text]="health || 'Unknown'" [variant]="healthVariant"></app-badge>
      </div>

      <!-- Stats summary -->
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-val">{{ stats.totalTasks }}</div>
          <div class="stat-lbl">Total Tasks</div>
        </div>
        <div class="stat-item">
          <div class="stat-val">{{ stats.completionPercent }}%</div>
          <div class="stat-lbl">Complete</div>
        </div>
        <div class="stat-item">
          <div class="stat-val">{{ stats.overdueCount }}</div>
          <div class="stat-lbl">Overdue</div>
        </div>
      </div>

      <!-- Status breakdown -->
      <div class="breakdown">
        <h4>By Status</h4>
        <div *ngFor="let entry of statusEntries" class="breakdown-item">
          <span class="breakdown-label">{{ entry.key }}</span>
          <div class="breakdown-bar">
            <div class="breakdown-fill" [style.width.%]="pct(entry.val, stats.totalTasks)"></div>
          </div>
          <span class="breakdown-val">{{ entry.val }}</span>
        </div>
      </div>

      <!-- Team workload -->
      <div *ngIf="workload.length" class="workload">
        <h4>Team Workload</h4>
        <div *ngFor="let w of workload" class="workload-item">
          <app-avatar [user]="w.member" size="sm"></app-avatar>
          <span class="workload-name">{{ w.member.username }}</span>
          <div class="workload-bars">
            <span class="workload-active">{{ w.activeTaskCount }} active</span>
            <span class="workload-done">{{ w.completedTaskCount }} done</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading { display: flex; justify-content: center; padding: 40px; }
    .analytics { display: flex; flex-direction: column; gap: 24px; }
    .health-row { display: flex; align-items: center; gap: 12px; }
    .health-label { font-weight: 600; font-size: 14px; }
    .stats-row { display: flex; gap: 24px; }
    .stat-item { text-align: center; }
    .stat-val { font-size: 28px; font-weight: 700; }
    .stat-lbl { font-size: 12px; color: var(--color-muted); }
    .breakdown h4, .workload h4 { margin: 0 0 12px; font-size: 14px; font-weight: 600; }
    .breakdown-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .breakdown-label { width: 100px; font-size: 12px; color: var(--color-muted); }
    .breakdown-bar { flex: 1; height: 6px; background: var(--color-border); border-radius: 100px; overflow: hidden; }
    .breakdown-fill { height: 100%; background: var(--color-accent); border-radius: 100px; transition: width 0.4s; }
    .breakdown-val { width: 24px; font-size: 12px; text-align: right; }
    .workload-item { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .workload-name { flex: 1; font-size: 13px; }
    .workload-bars { display: flex; gap: 12px; }
    .workload-active { font-size: 12px; color: var(--color-accent); }
    .workload-done   { font-size: 12px; color: var(--color-success); }
  `]
})
export class ProjectAnalyticsComponent implements OnInit {
  @Input() projectId = '';
  private readonly analyticsService = inject(AnalyticsService);

  stats: ProjectStats | null = null;
  workload: TeamWorkload[] = [];
  health: ProjectHealth | null = null;
  isLoading = true;

  get statusEntries(): { key: string; val: number }[] {
    if (!this.stats) return [];
    return Object.entries(this.stats.byStatus).map(([key, val]) => ({ key, val: val as number }));
  }

  get healthVariant(): 'success' | 'warning' | 'danger' {
    if (this.health === 'ON_TRACK') return 'success';
    if (this.health === 'AT_RISK') return 'warning';
    return 'danger';
  }

  pct(val: number, total: number): number {
    return total ? Math.round((val / total) * 100) : 0;
  }

  ngOnInit(): void {
    Promise.all([
      this.analyticsService.getStats(this.projectId).toPromise(),
      this.analyticsService.getTeamWorkload(this.projectId).toPromise(),
      this.analyticsService.getHealth(this.projectId).toPromise()
    ]).then(([stats, workload, health]) => {
      this.stats = stats ?? null;
      this.workload = workload ?? [];
      this.health = health ?? null;
      this.isLoading = false;
    }).catch(() => { this.isLoading = false; });
  }
}
