import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { forkJoin, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AnalyticsFilters, AnalyticsService } from '../../api/analytics.service';
import { ProjectService } from '../../api/project.service';
import { WorkspaceService } from '../../api/workspace.service';
import { AnalyticsInsight, ProjectStats, TeamPerformance, TeamWorkload } from '../../shared/models/analytics.model';
import { Project } from '../../shared/models/project.model';
import { Workspace } from '../../shared/models/workspace.model';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  DoughnutController,
  ArcElement,
  Legend,
  BarController,
  BarElement,
);

type AnalyticsView = 'overview' | 'team' | 'projects' | 'sprint' | 'workload' | 'flow' | 'reports';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export default class AnalyticsComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly projectService = inject(ProjectService);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  activeView: AnalyticsView = 'overview';
  assistantQuestion = '';
  toast = '';
  isLoading = true;
  isDateMenuOpen = false;
  isFilterOpen = false;
  performance: TeamPerformance | null = null;
  animatedPerformance: TeamPerformance | null = null;
  insights: AnalyticsInsight[] = [];
  workspaces: Workspace[] = [];
  projects: Project[] = [];
  teamWorkload: TeamWorkload[] = [];
  selectedWorkspaceId = '';
  selectedProjectId = '';
  selectedStats: ProjectStats | null = null;
  healthSummary: { progress?: number; overdueCount?: number; health?: string } | null = null;
  reportPreview = '';
  selectedPreset = 'last30';
  dateFrom = '';
  dateTo = '';

  readonly navItems: { key: AnalyticsView; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '⌂' },
    { key: 'team', label: 'Team Performance', icon: '◌' },
    { key: 'projects', label: 'Projects', icon: '□' },
    { key: 'sprint', label: 'Sprint Analytics', icon: '⌁' },
    { key: 'workload', label: 'Workload', icon: '◇' },
    { key: 'flow', label: 'Flow Metrics', icon: '○' },
    { key: 'reports', label: 'Reports', icon: '▣' },
  ];
  readonly datePresets = [
    { key: 'last7', label: 'Last 7 days' },
    { key: 'last30', label: 'Last 30 days' },
    { key: 'thisMonth', label: 'This month' },
    { key: 'next30', label: 'Next 30 days' },
  ];

  sprintChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  sprintChartOptions: ChartConfiguration<'line'>['options'] = this.lineOptions(40, true);
  workloadChartData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };
  workloadChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '64%',
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
  };

  ngOnInit(): void {
    this.restoreFiltersFromUrl();
    this.load();
  }

  load(): void {
    this.isLoading = true;
    const filters = this.analyticsFilters();
    this.syncFiltersToUrl(filters);
    forkJoin({
      performance: this.analyticsService.getTeamPerformance(filters).pipe(catchError(() => of(null))),
      insights: this.analyticsService.getInsights(filters).pipe(catchError(() => of([]))),
      workspaces: this.workspaceService.getAll().pipe(catchError(() => of([]))),
      projects: this.projectService.search({
        workspaceId: this.selectedWorkspaceId || undefined,
        sort: 'recent',
      }).pipe(catchError(() => of([]))),
    })
      .pipe(
        switchMap(({ performance, insights, workspaces, projects }) => {
          this.performance = performance;
          if (performance) this.animatePerformance(performance);
          this.insights = insights;
          this.workspaces = workspaces;
          this.projects = projects;
          if (this.selectedProjectId && !projects.some((project) => project.id === this.selectedProjectId)) {
            this.selectedProjectId = '';
          }
          if (!this.selectedProjectId) this.selectedProjectId = projects[0]?.id || '';
          if (!this.selectedProjectId) {
            return of({ stats: null, workload: [], health: null, report: '' });
          }
          return forkJoin({
            stats: this.analyticsService.getStats(this.selectedProjectId, {
              from: this.dateFrom || undefined,
              to: this.dateTo || undefined,
            }).pipe(catchError(() => of(null))),
            workload: this.analyticsService.getTeamWorkload(this.selectedProjectId).pipe(catchError(() => of([]))),
            health: this.analyticsService.getHealth(this.selectedProjectId).pipe(catchError(() => of(null))),
            report: this.analyticsService.getReport(this.selectedProjectId).pipe(catchError(() => of(''))),
          });
        }),
      )
      .subscribe((detail) => {
        this.selectedStats = detail.stats;
        this.teamWorkload = detail.workload;
        this.healthSummary = detail.health as { progress?: number; overdueCount?: number; health?: string } | null;
        this.reportPreview = detail.report;
        this.configureCharts();
        this.isLoading = false;
      });
  }

  selectProject(projectId: string): void {
    this.selectedProjectId = projectId;
    this.load();
  }

  applyDatePreset(preset: string): void {
    this.selectedPreset = preset;
    this.setPresetDates(preset);
    this.isDateMenuOpen = false;
    this.load();
  }

  onWorkspaceChange(): void {
    this.selectedProjectId = '';
    this.load();
  }

  clearFilters(): void {
    this.selectedWorkspaceId = '';
    this.selectedProjectId = '';
    this.load();
  }

  async shareAnalytics(): Promise<void> {
    const shareUrl = this.buildShareUrl(this.analyticsFilters());
    try {
      await navigator.clipboard.writeText(shareUrl);
      this.showToast('Share link copied');
    } catch {
      this.showToast(shareUrl);
    }
  }

  get dateRangeLabel(): string {
    const preset = this.datePresets.find((item) => item.key === this.selectedPreset);
    if (this.selectedPreset !== 'custom' && preset) return preset.label;
    if (this.dateFrom && this.dateTo) return `${this.dateFrom} to ${this.dateTo}`;
    return 'Select date range';
  }

  get activeFilterCount(): number {
    return [this.selectedWorkspaceId, this.selectedProjectId].filter(Boolean).length;
  }

  configureCharts(): void {
    const history = this.selectedStats?.sprintVelocityHistory ?? [];
    this.sprintChartData = {
      labels: history.map((point) => point.sprint),
      datasets: [
        {
          data: history.map((point) => point.value),
          borderColor: '#D4A853',
          backgroundColor: 'rgba(212,168,83,0.14)',
          pointBackgroundColor: '#D4A853',
          pointBorderColor: '#0C0C0E',
          pointRadius: 4,
          tension: 0.38,
          fill: true,
        },
      ],
    };

    const distribution = this.distribution;
    this.workloadChartData = {
      labels: distribution.map((item) => item.category),
      datasets: [
        {
          data: distribution.map((item) => item.count),
          backgroundColor: ['#60A5FA', '#D4A853', '#4ADE80', '#EF4444', '#8B7CF6'],
          borderWidth: 0,
        },
      ],
    };
  }

  get distribution() {
    return this.selectedStats?.workloadDistribution ?? [];
  }

  get totalDistributedTasks(): number {
    return this.distribution.reduce((sum, item) => sum + item.count, 0);
  }

  get statusRows(): { label: string; count: number }[] {
    return Object.entries(this.selectedStats?.byStatus ?? {}).map(([label, count]) => ({ label, count: Number(count) }));
  }

  get priorityRows(): { label: string; count: number }[] {
    return Object.entries(this.selectedStats?.byPriority ?? {}).map(([label, count]) => ({ label, count: Number(count) }));
  }

  get sprintRows() {
    return this.selectedStats?.sprintVelocityHistory ?? [];
  }

  get reportLines(): string[] {
    return this.reportPreview ? this.reportPreview.split('\n').slice(0, 14) : ['No report payload available.'];
  }

  get currentProject(): Project | undefined {
    return this.projects.find((project) => project.id === this.selectedProjectId);
  }

  get topStats() {
    const performance = this.animatedPerformance ?? this.performance;
    return [
      { label: 'Completion Rate', value: `${performance?.completionRate ?? 0}%`, trend: performance?.trendCompletion ?? 0, visual: 'line' },
      { label: 'Team Velocity', value: `${performance?.teamVelocity ?? 0}`, trend: performance?.trendVelocity ?? 0, visual: 'bars' },
      { label: 'Workload Balance', value: performance?.workloadBalance ?? 'Balanced', trend: 0, visual: 'ring' },
      { label: 'Projects Health', value: `${performance?.projectsHealth ?? 0}%`, trend: performance?.trendHealth ?? 0, visual: 'line' },
    ];
  }

  setQuestion(question: string): void {
    this.assistantQuestion = question;
  }

  sendAssistant(): void {
    this.showToast('Coming soon');
  }

  animatePerformance(target: TeamPerformance): void {
    const start = globalThis.performance.now();
    const duration = 800;
    const from = this.animatedPerformance ?? {
      completionRate: 0,
      trendCompletion: target.trendCompletion,
      teamVelocity: 0,
      trendVelocity: target.trendVelocity,
      workloadBalance: target.workloadBalance,
      projectsHealth: 0,
      trendHealth: target.trendHealth,
      teamProductivity: { tasksCompleted: 0, trend: target.teamProductivity.trend },
      focusTime: { hours: 0, trend: target.focusTime.trend },
      cycleTime: { days: 0, trend: target.cycleTime.trend },
      onTimeDelivery: { percent: 0, trend: target.onTimeDelivery.trend },
    };
    const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = easeOut(progress);
      const lerp = (a: number, b: number) => a + (b - a) * eased;
      this.animatedPerformance = {
        ...target,
        completionRate: Math.round(lerp(from.completionRate, target.completionRate)),
        teamVelocity: Math.round(lerp(from.teamVelocity, target.teamVelocity) * 10) / 10,
        projectsHealth: Math.round(lerp(from.projectsHealth, target.projectsHealth)),
        teamProductivity: {
          ...target.teamProductivity,
          tasksCompleted: Math.round(lerp(from.teamProductivity.tasksCompleted, target.teamProductivity.tasksCompleted)),
        },
        focusTime: {
          ...target.focusTime,
          hours: Math.round(lerp(from.focusTime.hours, target.focusTime.hours) * 10) / 10,
        },
        cycleTime: {
          ...target.cycleTime,
          days: Math.round(lerp(from.cycleTime.days, target.cycleTime.days) * 10) / 10,
        },
        onTimeDelivery: {
          ...target.onTimeDelivery,
          percent: Math.round(lerp(from.onTimeDelivery.percent, target.onTimeDelivery.percent)),
        },
      };
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  lineOptions(max: number, axes: boolean): ChartConfiguration<'line'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        x: {
          display: axes,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#5A5A6A', font: { size: 11 } },
        },
        y: {
          display: axes,
          min: 0,
          max,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#5A5A6A', font: { size: 11 } },
        },
      },
    };
  }

  private analyticsFilters(): AnalyticsFilters {
    return {
      from: this.dateFrom || undefined,
      to: this.dateTo || undefined,
      workspaceId: this.selectedWorkspaceId || undefined,
      projectId: this.selectedProjectId || undefined,
    };
  }

  private restoreFiltersFromUrl(): void {
    const params = this.route.snapshot.queryParamMap;
    this.selectedWorkspaceId = params.get('workspaceId') || '';
    this.selectedProjectId = params.get('projectId') || '';
    this.dateFrom = params.get('from') || '';
    this.dateTo = params.get('to') || '';
    if (this.dateFrom || this.dateTo) {
      this.selectedPreset = 'custom';
    } else {
      this.setPresetDates(this.selectedPreset);
    }
  }

  private setPresetDates(preset: string): void {
    const today = new Date();
    let from = new Date(today);
    let to = new Date(today);
    if (preset === 'last7') {
      from.setDate(today.getDate() - 6);
    } else if (preset === 'thisMonth') {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (preset === 'next30') {
      to.setDate(today.getDate() + 30);
    } else {
      from.setDate(today.getDate() - 29);
    }
    this.dateFrom = this.formatDate(from);
    this.dateTo = this.formatDate(to);
  }

  private syncFiltersToUrl(filters: AnalyticsFilters): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: filters,
      replaceUrl: true,
    });
  }

  private buildShareUrl(filters: AnalyticsFilters): string {
    const url = new URL(window.location.href);
    ['from', 'to', 'workspaceId', 'projectId'].forEach((key) => url.searchParams.delete(key));
    Object.entries(filters).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
    return url.toString();
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private showToast(message: string): void {
    this.toast = message;
    window.setTimeout(() => (this.toast = ''), 1800);
  }
}
