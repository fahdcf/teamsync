import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { AnalyticsService } from '../../api/analytics.service';
import { ProjectService } from '../../api/project.service';
import { AnalyticsInsight, ProjectStats, TeamPerformance } from '../../shared/models/analytics.model';
import { Project } from '../../shared/models/project.model';

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

  activeView: AnalyticsView = 'overview';
  assistantQuestion = '';
  toast = '';
  isLoading = true;
  performance: TeamPerformance | null = null;
  animatedPerformance: TeamPerformance | null = null;
  insights: AnalyticsInsight[] = [];
  projects: Project[] = [];
  selectedProjectId = '';
  selectedStats: ProjectStats | null = null;

  readonly navItems: { key: AnalyticsView; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '⌂' },
    { key: 'team', label: 'Team Performance', icon: '◌' },
    { key: 'projects', label: 'Projects', icon: '□' },
    { key: 'sprint', label: 'Sprint Analytics', icon: '⌁' },
    { key: 'workload', label: 'Workload', icon: '◇' },
    { key: 'flow', label: 'Flow Metrics', icon: '○' },
    { key: 'reports', label: 'Reports', icon: '▣' },
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
    this.load();
  }

  load(): void {
    this.isLoading = true;
    forkJoin({
      performance: this.analyticsService.getTeamPerformance().pipe(catchError(() => of(null))),
      insights: this.analyticsService.getInsights().pipe(catchError(() => of([]))),
      projects: this.projectService.search().pipe(catchError(() => of([]))),
    })
      .pipe(
        switchMap(({ performance, insights, projects }) => {
          this.performance = performance;
          if (performance) this.animatePerformance(performance);
          this.insights = insights;
          this.projects = projects;
          this.selectedProjectId = projects[0]?.id || '';
          if (!this.selectedProjectId) return of(null);
          return this.analyticsService.getStats(this.selectedProjectId).pipe(catchError(() => of(null)));
        }),
      )
      .subscribe((stats) => {
        this.selectedStats = stats;
        this.configureCharts();
        this.isLoading = false;
      });
  }

  selectProject(projectId: string): void {
    this.selectedProjectId = projectId;
    this.analyticsService.getStats(projectId).subscribe((stats) => {
      this.selectedStats = stats;
      this.configureCharts();
    });
  }

  configureCharts(): void {
    const history = this.selectedStats?.sprintVelocityHistory?.length
      ? this.selectedStats.sprintVelocityHistory
      : [
          { sprint: 'May 12', value: 12 },
          { sprint: 'May 19', value: 18 },
          { sprint: 'May 26', value: 24 },
          { sprint: 'Jun 2', value: 22 },
          { sprint: 'Jun 9', value: 30 },
        ];
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
    return this.selectedStats?.workloadDistribution?.length
      ? this.selectedStats.workloadDistribution
      : [
          { category: 'Design', count: 32, percent: 32 },
          { category: 'Engineering', count: 28, percent: 28 },
          { category: 'Marketing', count: 20, percent: 20 },
          { category: 'Product', count: 12, percent: 12 },
          { category: 'Others', count: 8, percent: 8 },
        ];
  }

  get totalDistributedTasks(): number {
    return this.distribution.reduce((sum, item) => sum + item.count, 0);
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

  get bottomStats() {
    const performance = this.animatedPerformance ?? this.performance;
    return [
      { title: 'Team Productivity', label: 'Tasks completed', value: `${performance?.teamProductivity.tasksCompleted ?? 0}`, trend: performance?.teamProductivity.trend ?? 0 },
      { title: 'Focus Time', label: 'Deep work hours', value: `${performance?.focusTime.hours ?? 0}h`, trend: performance?.focusTime.trend ?? 0 },
      { title: 'Cycle Time', label: 'Average cycle time', value: `${performance?.cycleTime.days ?? 0} days`, trend: performance?.cycleTime.trend ?? 0 },
      { title: 'On-Time Delivery', label: 'On-time completion', value: `${performance?.onTimeDelivery.percent ?? 0}%`, trend: performance?.onTimeDelivery.trend ?? 0 },
    ];
  }

  setQuestion(question: string): void {
    this.assistantQuestion = question;
  }

  sendAssistant(): void {
    this.toast = 'Coming soon';
    window.setTimeout(() => (this.toast = ''), 1800);
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
}
