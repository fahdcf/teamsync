import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { AuthStore } from '../../store/auth.store';
import { DashboardDeadline, DashboardProjectOverview, DashboardService, DashboardStats } from '../../api/dashboard.service';
import { ProjectService } from '../../api/project.service';
import { TaskService } from '../../api/task.service';
import { WorkspaceService } from '../../api/workspace.service';
import { Project } from '../../shared/models/project.model';
import { Task, TaskStatus } from '../../shared/models/task.model';
import { User } from '../../shared/models/user.model';
import { Workspace } from '../../shared/models/workspace.model';
import { TaskCardComponent } from '../task/task-card/task-card.component';

interface BoardColumn {
  label: string;
  status: TaskStatus;
  tasks: Task[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, TaskCardComponent],
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
            <rect *ngFor="let bar of bars; let i = index" [attr.x]="i * 22 + 8" [attr.y]="48 - bar" width="8" [attr.height]="bar"></rect>
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

      <section class="board-section">
        <div class="section-toolbar">
          <div class="toolbar-left">
            <h2>Project Board</h2>
            <select [(ngModel)]="selectedProjectId" (ngModelChange)="loadProjectTasks($event)" aria-label="Select project">
              <option *ngFor="let project of projects" [value]="project.id">{{ project.title }}</option>
            </select>
          </div>
          <div class="toolbar-actions">
            <button type="button">Filter</button>
            <button type="button">Customize</button>
            <button type="button" aria-label="More">...</button>
          </div>
        </div>

        <div class="kanban-board">
          <article class="kanban-column" *ngFor="let column of boardColumns"
            [attr.data-status]="column.status">
            <header class="kanban-col-header">
              <div class="kanban-col-title-row">
                <span class="kanban-col-dot" [attr.data-status]="column.status"></span>
                <h3>{{ column.label }}</h3>
                <span class="kanban-col-count">{{ column.tasks.length }}</span>
              </div>
            </header>
            <div class="kanban-col-body">
              <app-task-card
                *ngFor="let task of column.tasks"
                [task]="task"
                [readonly]="true"
                [commentCount]="task.dependencies?.length || 0">
              </app-task-card>
              <div *ngIf="!column.tasks.length" class="kanban-empty-col">
                <span>No tasks</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="analytics-overview">
        <div class="section-toolbar">
          <h2>Analytics Overview</h2>
          <button type="button">This week v</button>
        </div>
        <div class="analytics-grid">
          <article class="dash-card analytic-card">
            <span>Progress Overview</span>
            <strong>{{ animatedStats.completionRate }}%</strong>
            <small>{{ trendText(stats?.trendCompletion) }} from last week</small>
            <svg viewBox="0 0 220 80" preserveAspectRatio="none"><path d="M0 64 C22 58 34 42 55 45 C80 49 85 30 110 34 C132 38 144 24 165 28 C190 30 196 12 220 10"></path></svg>
            <div class="days"><span *ngFor="let day of days">{{ day }}</span></div>
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
            <div class="mini-bars"><i *ngFor="let bar of bars" [style.height.px]="bar"></i></div>
            <div class="member-avatars"><span *ngFor="let member of teamMembers">{{ initials(member) }}</span></div>
          </article>
          <article class="dash-card analytic-card">
            <span>Time Tracked</span>
            <strong>{{ timeTracked }}h</strong>
            <small>↑ 16% from last week</small>
            <svg viewBox="0 0 220 80" preserveAspectRatio="none"><path d="M0 58 C20 30 34 66 56 45 C76 24 90 34 112 38 C140 42 140 18 164 20 C188 23 196 4 220 8"></path></svg>
            <div class="days"><span *ngFor="let day of days">{{ day }}</span></div>
          </article>
        </div>
      </section>

      <section class="dashboard-bottom">
        <div class="left-stack">
          <article class="dash-card activity-card">
            <header><h2>Recent Activity</h2><a href="#">View all activity -></a></header>
            <div class="activity-row" *ngFor="let activity of recentActivity">
              <span>{{ activity.initials }}</span>
              <p><strong>{{ activity.name }}</strong> {{ activity.action }}</p>
              <time>{{ activity.time }}</time>
            </div>
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
  selectedProjectId = '';

  readonly bars = [20, 34, 28, 40, 18, 36, 25, 31];
  readonly days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  readonly recentActivity = [
    { initials: 'EW', name: 'Emma Wilson', action: 'completed Homepage design', time: '2m ago' },
    { initials: 'MJ', name: 'Mike Johnson', action: 'commented on UI kit review', time: '15m ago' },
    { initials: 'SC', name: 'Sarah Chen', action: 'moved task to In Progress', time: '1h ago' },
    { initials: 'AI', name: 'AI Assistant', action: 'generated 3 task suggestions', time: '2h ago' },
    { initials: 'DS', name: 'Design System', action: 'was updated', time: '3h ago' },
  ];

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

  get boardColumns(): BoardColumn[] {
    return [
      { label: 'To Do', status: 'TODO', tasks: this.tasks.filter((task) => task.status === 'TODO') },
      { label: 'In Progress', status: 'IN_PROGRESS', tasks: this.tasks.filter((task) => task.status === 'IN_PROGRESS') },
      { label: 'Review', status: 'IN_REVIEW', tasks: this.tasks.filter((task) => task.status === 'IN_REVIEW') },
      { label: 'Done', status: 'DONE', tasks: this.tasks.filter((task) => task.status === 'DONE') },
    ];
  }

  get teamMembers(): User[] {
    const members = this.workspaces.flatMap((workspace) => workspace.members || []);
    const unique = new Map(members.map((member) => [member.id, member]));
    return Array.from(unique.values()).slice(0, 4);
  }

  get timeTracked(): number {
    return Math.max(24, this.tasks.length * 4);
  }

  get firstTaskTitle(): string {
    return this.tasks.find((task) => task.status === 'IN_PROGRESS')?.title || 'current priorities';
  }

  load(): void {
    forkJoin({
      stats: this.dashboardService.getStats(),
      deadlines: this.dashboardService.getUpcomingDeadlines(),
      overview: this.dashboardService.getProjectsOverview(),
      workspaces: this.workspaceService.getAll(),
    })
      .pipe(
        switchMap((data) => {
          this.stats = data.stats;
          this.animateStats(data.stats);
          this.deadlines = data.deadlines;
          this.overviewProjects = data.overview;
          this.workspaces = data.workspaces;
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

  openTask(id: string): void {
    this.router.navigate(['/tasks', id]);
  }

  trendText(value: number | undefined): string {
    const trend = value ?? 0;
    return `${trend >= 0 ? '↑' : '↓'} ${Math.abs(trend)}%`;
  }

  priorityCount(priority: Task['priority']): number {
    return this.tasks.filter((task) => task.priority === priority).length;
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
