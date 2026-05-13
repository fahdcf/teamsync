import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { AuthStore } from '../../store/auth.store';
import { ActivityService } from '../../api/activity.service';
import { DashboardChartSeries, DashboardDateRange, DashboardDeadline, DashboardProjectOverview, DashboardService, DashboardStats } from '../../api/dashboard.service';
import { ProjectService } from '../../api/project.service';
import { TaskService } from '../../api/task.service';
import { WorkspaceService } from '../../api/workspace.service';
import { Project } from '../../shared/models/project.model';
import { ActivityLog } from '../../shared/models/activity.model';
import { Task } from '../../shared/models/task.model';
import { User } from '../../shared/models/user.model';
import { Workspace } from '../../shared/models/workspace.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="dashboard-page">
      <section class="dashboard-hero">
        <div class="greeting-copy">
          <span class="sun-icon">☀</span>
          <div>
            <h1>Good {{ timeOfDay }}, {{ currentUser?.username || 'there' }}.</h1>
            <p>You have {{ activeProjectsCount }} active projects and {{ animatedStats.activeTasks }} tasks in progress.</p>
            <p>Let's make today productive.</p>
          </div>
        </div>

        <article class="ai-insight-card">
          <strong>⚡ AI Insight</strong>
          <p>You're on track to complete 91% of your tasks this week.</p>
          <a href="#">View details -></a>
        </article>
      </section>

      <section class="stat-row">
        <article class="dash-card stat-card">
          <span class="stat-label">Active Tasks</span>
          <strong>{{ animatedStats.activeTasks }}</strong>
          <span class="trend" [class.down]="(stats?.trendActiveTasks || 0) < 0">{{ trendText(stats?.trendActiveTasks) }} from last week</span>
          <svg class="sparkline" viewBox="0 0 180 48" preserveAspectRatio="none">
            <path d="M0 36 C18 35 20 21 38 24 C58 28 62 13 82 17 C102 21 112 38 132 29 C150 20 158 14 180 8"></path>
          </svg>
        </article>

        <article class="dash-card stat-card progress-stat">
          <span class="stat-label">Completion Rate</span>
          <strong>{{ animatedStats.completionRate }}%</strong>
          <span class="trend" [class.down]="(stats?.trendCompletion || 0) < 0">{{ trendText(stats?.trendCompletion) }} from last week</span>
          <svg class="ring" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="28"></circle>
            <circle cx="40" cy="40" r="28" [attr.stroke-dasharray]="completionDash"></circle>
          </svg>
        </article>

        <article class="dash-card stat-card">
          <span class="stat-label">Team Velocity</span>
          <strong>{{ animatedStats.teamVelocity }}</strong>
          <span class="trend" [class.down]="(stats?.trendVelocity || 0) < 0">{{ trendText(stats?.trendVelocity) }} from last week</span>
          <svg class="barline" viewBox="0 0 180 48">
            <rect *ngFor="let bar of velocityBars; let i = index" [attr.x]="i * 22 + 8" [attr.y]="48 - bar" width="8" [attr.height]="bar"></rect>
          </svg>
        </article>

        <article class="dash-card stat-card">
          <span class="stat-label">Overdue Items</span>
          <strong [class.danger-value]="animatedStats.overdueItems > 0">{{ animatedStats.overdueItems }}</strong>
          <span class="trend overdue" [class.down]="(stats?.trendOverdue || 0) > 0">{{ trendText(stats?.trendOverdue) }} from last week</span>
          <svg class="sparkline danger-line" viewBox="0 0 180 48" preserveAspectRatio="none">
            <path d="M0 12 C18 18 22 8 38 16 C55 28 65 13 82 16 C100 18 102 34 122 36 C145 38 150 16 180 30"></path>
          </svg>
        </article>
      </section>

      <section class="dashboard-calendar-section">
        <div class="section-toolbar">
          <div class="toolbar-left">
            <h2>Calendar</h2>
            <span class="calendar-month-label">{{ dashboardMonthLabel }}</span>
          </div>
          <div class="toolbar-actions">
            <button type="button" (click)="previousDashboardMonth()">‹</button>
            <button type="button" (click)="goToCurrentDashboardMonth()">Today</button>
            <button type="button" (click)="nextDashboardMonth()">›</button>
          </div>
        </div>

        <article class="dash-card dashboard-calendar-card">
          <div class="calendar-weekdays">
            <span *ngFor="let day of calendarWeekdays">{{ day }}</span>
          </div>
          <div class="dashboard-calendar-grid">
            <div
              class="dashboard-calendar-day"
              *ngFor="let day of dashboardCalendarDays"
              [class.other-month]="!day.isCurrentMonth"
              [class.today]="day.isToday"
            >
              <div class="calendar-day-number">{{ day.date.getDate() }}</div>
              <div class="calendar-day-events">
                <span
                  *ngFor="let event of day.events | slice:0:2"
                  [class]="event.priority.toLowerCase()"
                  [title]="event.title"
                >
                  {{ event.title }}
                </span>
                <em *ngIf="day.events.length > 2">+{{ day.events.length - 2 }} more</em>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section class="analytics-overview">
        <div class="section-toolbar">
          <h2>Analytics Overview</h2>
          <select [value]="selectedRangeKey" (change)="setDashboardRange($event)">
            <option *ngFor="let option of rangeOptions" [value]="option.key">{{ option.label }}</option>
          </select>
        </div>
        <div class="analytics-grid">
          <article class="dash-card analytic-card">
            <span>Progress Overview</span>
            <strong>{{ animatedStats.completionRate }}%</strong>
            <small>{{ trendText(stats?.trendCompletion) }} from last week</small>
            <svg viewBox="0 0 220 80" preserveAspectRatio="none"><path [attr.d]="seriesPath(chartSeries.completionSeries, 220, 80)"></path></svg>
            <div class="days"><span *ngFor="let day of chartSeries.dayLabels">{{ day }}</span></div>
          </article>
          <article class="dash-card priority-card">
            <span>Tasks by Priority</span>
            <div class="donut-wrap">
              <svg viewBox="0 0 100 100">
                <circle class="donut high" cx="50" cy="50" r="34"></circle>
                <circle class="donut medium" cx="50" cy="50" r="34"></circle>
                <circle class="donut low" cx="50" cy="50" r="34"></circle>
              </svg>
              <strong>{{ tasks.length }}<small>Total</small></strong>
            </div>
            <div class="legend">
              <span><i class="high"></i>High {{ priorityCount('HIGH') + priorityCount('CRITICAL') }}</span>
              <span><i class="medium"></i>Medium {{ priorityCount('MEDIUM') }}</span>
              <span><i class="low"></i>Low {{ priorityCount('LOW') }}</span>
            </div>
          </article>
          <article class="dash-card workload-card">
            <span>Team Workload</span>
            <strong>Balanced</strong>
            <small>No issues detected</small>
            <div class="mini-bars"><i *ngFor="let bar of workloadBars" [style.height.px]="bar"></i></div>
            <div class="member-avatars"><span *ngFor="let member of teamMembers">{{ initials(member) }}</span></div>
          </article>
        </div>
      </section>

      <section class="dashboard-bottom">
        <div class="left-stack">
          <article class="dash-card activity-card">
            <header><h2>Recent Activity</h2><a href="#">View all activity -></a></header>
            <div
              class="activity-row"
              *ngFor="let activity of recentActivity"
              (click)="openActivity(activity)"
              tabindex="0"
              (keydown.enter)="openActivity(activity)"
            >
              <span>{{ initials(activity.user) }}</span>
              <p><strong>{{ activity.user?.username || 'System' }}</strong> {{ readableActivity(activity.action) }}</p>
              <time>{{ activity.createdAt | date:'short' }}</time>
            </div>
            <p class="empty-copy" *ngIf="!recentActivity.length">No recent activity yet.</p>
          </article>

          <article class="dash-card deadline-card">
            <header><h2>Upcoming Deadlines</h2><a href="#">View calendar -></a></header>
            <div class="deadline-row" *ngFor="let deadline of deadlines">
              <span>□</span>
              <strong>{{ deadline.title }}</strong>
              <time>{{ deadline.dueDate | date:'MMM d, y' }}</time>
              <i [class]="deadline.priority.toLowerCase()"></i>
            </div>
            <p class="empty-copy" *ngIf="!deadlines.length">No upcoming deadlines in the next 7 days.</p>
          </article>
        </div>

        <aside class="right-stack">
          <article class="dash-card assistant-card">
            <header><h2>⚡ AI Assistant</h2></header>
            <p>Here are some suggestions to boost your productivity</p>
            <div class="insight-row danger"><i></i><span>2 tasks are at risk of being overdue</span><a href="#">Review now -></a></div>
            <div class="insight-row warning"><i></i><span>You can complete 5 more tasks this week</span><a href="#">View tasks -></a></div>
            <div class="insight-row success"><i></i><span>Team workload is perfectly balanced</span><a href="#">Great job! -></a></div>
          </article>

          <article class="dash-card members-card">
            <header><h2>Team Members</h2><a href="#">View all -></a></header>
            <div class="member-row" *ngFor="let member of teamMembers">
              <span>{{ initials(member) }}</span>
              <div><strong>{{ member.username }}</strong><small>{{ member.role }}</small></div>
              <p><i></i> Working on {{ firstTaskTitle }}</p>
            </div>
          </article>

          <article class="dash-card projects-card">
            <header><h2>Projects Overview</h2><a href="#">View all projects -></a></header>
            <div class="project-row" *ngFor="let project of overviewProjects">
              <span>▣</span>
              <strong>{{ project.title }}</strong>
              <div class="progress-track"><i [style.width.%]="project.progress" [class]="project.status.toLowerCase()"></i></div>
              <em>{{ project.progress }}%</em>
            </div>
          </article>
        </aside>
      </section>
    </div>
  `,
  styles: [],
})
export default class DashboardComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly activityService = inject(ActivityService);
  private readonly dashboardService = inject(DashboardService);
  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly router = inject(Router);

  currentUser: User | null = null;
  stats: DashboardStats | null = null;
  animatedStats: DashboardStats = {
    activeTasks: 0,
    completionRate: 0,
    teamVelocity: 0,
    overdueItems: 0,
    trendActiveTasks: 0,
    trendCompletion: 0,
    trendVelocity: 0,
    trendOverdue: 0,
  };
  deadlines: DashboardDeadline[] = [];
  overviewProjects: DashboardProjectOverview[] = [];
  projects: Project[] = [];
  workspaces: Workspace[] = [];
  tasks: Task[] = [];
  recentActivity: ActivityLog[] = [];
  selectedProjectId = '';
  dashboardCalendarDate = new Date();

  readonly calendarWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  chartSeries: DashboardChartSeries = {
    dayLabels: [],
    completionSeries: [],
    workloadSeries: [],
  };
  readonly rangeOptions = [
    { key: 'week', label: 'This week' },
    { key: 'month', label: 'This month' },
    { key: 'quarter', label: 'Last 90 days' },
  ];
  selectedRangeKey = 'week';

  ngOnInit(): void {
    this.authStore.user$.subscribe((user) => (this.currentUser = user));
    this.load();
  }

  get timeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  get activeProjectsCount(): number {
    return this.overviewProjects.filter((project) => project.status === 'ACTIVE').length || this.overviewProjects.length;
  }

  get completionDash(): string {
    const pct = Math.max(0, Math.min(100, this.stats?.completionRate || 0));
    return `${(pct / 100) * 176} 176`;
  }

  get teamMembers(): User[] {
    const members = this.workspaces.flatMap((workspace) => workspace.members || []);
    const unique = new Map(members.map((member) => [member.id, member]));
    return Array.from(unique.values()).slice(0, 4);
  }

  get firstTaskTitle(): string {
    return this.tasks.find((task) => task.status === 'IN_PROGRESS')?.title || 'current priorities';
  }

  get workloadBars(): number[] {
    const values = this.chartSeries.workloadSeries.length ? this.chartSeries.workloadSeries : [0];
    const max = Math.max(1, ...values);
    return values.map((value) => Math.max(8, Math.round((value / max) * 42)));
  }

  get velocityBars(): number[] {
    const values = this.chartSeries.completionSeries.length ? this.chartSeries.completionSeries : [0];
    const max = Math.max(1, ...values);
    return values.map((value) => Math.max(8, Math.round((value / max) * 40)));
  }

  get dashboardMonthLabel(): string {
    return this.dashboardCalendarDate.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
  }

  get dashboardCalendarDays(): { date: Date; isCurrentMonth: boolean; isToday: boolean; events: { title: string; priority: Task['priority'] }[] }[] {
    const year = this.dashboardCalendarDate.getFullYear();
    const month = this.dashboardCalendarDate.getMonth();
    const today = new Date();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; events: { title: string; priority: Task['priority'] }[] }[] = [];

    for (let index = 0; index < firstDay.getDay(); index++) {
      days.push({
        date: new Date(year, month, index - firstDay.getDay() + 1),
        isCurrentMonth: false,
        isToday: false,
        events: [],
      });
    }

    for (let dateNumber = 1; dateNumber <= lastDay.getDate(); dateNumber++) {
      const date = new Date(year, month, dateNumber);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        events: this.eventsForCalendarDay(date),
      });
    }

    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let index = 1; index <= remaining; index++) {
        days.push({
          date: new Date(year, month + 1, index),
          isCurrentMonth: false,
          isToday: false,
          events: [],
        });
      }
    }

    return days;
  }

  load(): void {
    const range = this.currentDateRange();
    forkJoin({
      stats: this.dashboardService.getStats(range),
      deadlines: this.dashboardService.getUpcomingDeadlines(range),
      overview: this.dashboardService.getProjectsOverview(),
      workspaces: this.workspaceService.getAll(),
      activity: this.activityService.getMyActivity(),
      chartSeries: this.dashboardService.getChartSeries(range),
    })
      .pipe(
        switchMap((data) => {
          this.stats = data.stats;
          this.animateStats(data.stats);
          this.deadlines = data.deadlines;
          this.overviewProjects = data.overview;
          this.workspaces = data.workspaces;
          this.recentActivity = data.activity;
          this.chartSeries = data.chartSeries;
          const workspaceId = data.workspaces[0]?.id;
          if (!workspaceId) return of([] as Project[]);
          return this.projectService.getByWorkspace(workspaceId);
        })
      )
      .subscribe({
        next: (projects) => {
          this.projects = projects;
          this.selectedProjectId = projects[0]?.id || '';
          if (this.selectedProjectId) this.loadProjectTasks(this.selectedProjectId);
        },
        error: () => {
          this.stats = this.stats ?? {
            activeTasks: 0,
            completionRate: 0,
            teamVelocity: 0,
            overdueItems: 0,
            trendActiveTasks: 0,
            trendCompletion: 0,
            trendVelocity: 0,
            trendOverdue: 0,
          };
          this.animateStats(this.stats);
        },
      });
  }

  animateStats(target: DashboardStats): void {
    const start = performance.now();
    const duration = 800;
    const from = { ...this.animatedStats };
    const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = easeOut(progress);
      this.animatedStats = {
        ...target,
        activeTasks: Math.round(from.activeTasks + (target.activeTasks - from.activeTasks) * eased),
        completionRate: Math.round(from.completionRate + (target.completionRate - from.completionRate) * eased),
        teamVelocity: Math.round(from.teamVelocity + (target.teamVelocity - from.teamVelocity) * eased),
        overdueItems: Math.round(from.overdueItems + (target.overdueItems - from.overdueItems) * eased),
      };
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  loadProjectTasks(projectId: string): void {
    if (!projectId) {
      this.tasks = [];
      return;
    }

    this.taskService.getByProject(projectId).subscribe({
      next: (tasks) => (this.tasks = tasks),
      error: () => (this.tasks = []),
    });
  }

  previousDashboardMonth(): void {
    this.dashboardCalendarDate = new Date(this.dashboardCalendarDate.getFullYear(), this.dashboardCalendarDate.getMonth() - 1, 1);
  }

  nextDashboardMonth(): void {
    this.dashboardCalendarDate = new Date(this.dashboardCalendarDate.getFullYear(), this.dashboardCalendarDate.getMonth() + 1, 1);
  }

  goToCurrentDashboardMonth(): void {
    this.dashboardCalendarDate = new Date();
  }

  setDashboardRange(event: Event): void {
    this.selectedRangeKey = (event.target as HTMLSelectElement).value;
    this.load();
  }

  currentDateRange(): DashboardDateRange {
    const today = new Date();
    const to = this.formatDate(today);
    if (this.selectedRangeKey === 'month') {
      return { from: this.formatDate(new Date(today.getFullYear(), today.getMonth(), 1)), to };
    }
    if (this.selectedRangeKey === 'quarter') {
      const from = new Date(today);
      from.setDate(today.getDate() - 89);
      return { from: this.formatDate(from), to };
    }
    const day = today.getDay() || 7;
    const from = new Date(today);
    from.setDate(today.getDate() - day + 1);
    return { from: this.formatDate(from), to };
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  eventsForCalendarDay(date: Date): { title: string; priority: Task['priority'] }[] {
    const taskEvents = this.tasks
      .filter((task) => task.dueDate && this.isSameDay(new Date(task.dueDate), date))
      .map((task) => ({ title: task.title, priority: task.priority }));
    const deadlineEvents = this.deadlines
      .filter((deadline) => deadline.dueDate && this.isSameDay(new Date(deadline.dueDate), date))
      .map((deadline) => ({ title: deadline.title, priority: deadline.priority }));
    return [...taskEvents, ...deadlineEvents];
  }

  isSameDay(left: Date, right: Date): boolean {
    return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
  }

  openTask(id: string): void {
    this.router.navigate(['/tasks', id]);
  }

  openActivity(activity: ActivityLog): void {
    const entityType = activity.entityType?.toUpperCase();
    if (entityType === 'TASK') {
      this.router.navigate(['/tasks', activity.entityId]);
      return;
    }
    if (entityType === 'PROJECT') {
      this.router.navigate(['/projects', activity.entityId]);
      return;
    }
    if (entityType === 'WORKSPACE') {
      this.router.navigate(['/workspaces', activity.entityId]);
    }
  }

  readableActivity(action: string | null | undefined): string {
    if (!action) return 'recorded an activity';
    return action
      .replace(/_/g, ' ')
      .toLowerCase();
  }

  trendText(value: number | undefined): string {
    const trend = value ?? 0;
    return `${trend >= 0 ? '↑' : '↓'} ${Math.abs(trend)}%`;
  }

  priorityCount(priority: Task['priority']): number {
    return this.tasks.filter((task) => task.priority === priority).length;
  }

  seriesPath(series: number[], width: number, height: number): string {
    const values = series.length ? series : [0];
    if (values.length === 1) {
      const y = height - this.normalizedY(values[0], values, height);
      return `M0 ${y} L${width} ${y}`;
    }
    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = height - this.normalizedY(value, values, height);
        return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
      })
      .join(' ');
  }

  private normalizedY(value: number, values: number[], height: number): number {
    const max = Math.max(1, ...values);
    return 8 + (value / max) * (height - 16);
  }

  initials(user: User | null): string {
    if (!user?.username) return '??';
    return user.username
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
