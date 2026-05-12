import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of, switchMap } from 'rxjs';
import { TaskService } from '../../../api/task.service';
import { ProjectService } from '../../../api/project.service';
import { WorkspaceService } from '../../../api/workspace.service';
import { Task } from '../../../shared/models/task.model';

interface CalendarDay { date: Date; isCurrentMonth: boolean; isToday: boolean; tasks: Task[]; }

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="calendar-page">
      <header class="page-header">
        <div class="header-left">
          <h1>Calendar</h1>
          <span class="current-label">{{ monthName }} {{ year }}</span>
        </div>
        <div class="nav-actions">
          <button class="nav-btn" (click)="prevMonth()" type="button">&#8249;</button>
          <button class="today-btn" (click)="goToday()" type="button">Today</button>
          <button class="nav-btn" (click)="nextMonth()" type="button">&#8250;</button>
        </div>
      </header>
      <div class="loading-row" *ngIf="loading"><div class="spinner"></div><span>Loading…</span></div>
      <div class="calendar-wrap" *ngIf="!loading">
        <div class="day-headers">
          <div class="day-header" *ngFor="let d of dayNames">{{ d }}</div>
        </div>
        <div class="calendar-grid">
          <div class="day-cell" *ngFor="let day of calendarDays"
            [class.other-month]="!day.isCurrentMonth" [class.today]="day.isToday">
            <div class="day-num" [class.today-num]="day.isToday">{{ day.date.getDate() }}</div>
            <div class="day-tasks">
              <div class="task-chip" *ngFor="let task of day.tasks | slice:0:3"
                [class]="task.priority.toLowerCase()" [title]="task.title">{{ task.title }}</div>
              <div class="more-chip" *ngIf="day.tasks.length > 3">+{{ day.tasks.length - 3 }} more</div>
            </div>
          </div>
        </div>
      </div>
      <div class="legend">
        <span class="legend-item"><i class="dot low"></i> Low</span>
        <span class="legend-item"><i class="dot medium"></i> Medium</span>
        <span class="legend-item"><i class="dot high"></i> High</span>
        <span class="legend-item"><i class="dot critical"></i> Critical</span>
      </div>
    </div>
  `,
  styles: [`
    .calendar-page { min-height:100%; padding:32px; background:var(--bg-base); color:var(--text-primary); display:flex; flex-direction:column; gap:24px; }
    .page-header { display:flex; align-items:center; justify-content:space-between; }
    .header-left { display:flex; align-items:baseline; gap:14px; }
    h1 { font-size:24px; font-weight:600; }
    .current-label { font-size:16px; color:var(--text-secondary); }
    .nav-actions { display:flex; align-items:center; gap:6px; }
    .nav-btn { width:32px; height:32px; border:1px solid var(--border-subtle); border-radius:var(--radius-md); background:var(--bg-surface); color:var(--text-secondary); font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
    .nav-btn:hover { border-color:var(--border-default); color:var(--text-primary); }
    .today-btn { height:32px; padding:0 14px; border:1px solid var(--border-subtle); border-radius:var(--radius-md); background:var(--bg-surface); color:var(--text-secondary); font-size:13px; cursor:pointer; transition:all 0.15s; }
    .today-btn:hover { border-color:var(--accent); color:var(--accent); }
    .loading-row { display:flex; align-items:center; gap:12px; padding:48px 0; justify-content:center; color:var(--text-secondary); }
    .spinner { width:20px; height:20px; border:2px solid var(--border-default); border-top-color:var(--accent); border-radius:50%; animation:spin 0.7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .calendar-wrap { background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); overflow:hidden; }
    .day-headers { display:grid; grid-template-columns:repeat(7,1fr); border-bottom:1px solid var(--border-subtle); }
    .day-header { padding:10px; font-size:11px; font-weight:600; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.06em; text-align:center; }
    .calendar-grid { display:grid; grid-template-columns:repeat(7,1fr); }
    .day-cell { min-height:110px; padding:8px; border-right:1px solid var(--border-subtle); border-bottom:1px solid var(--border-subtle); display:flex; flex-direction:column; gap:4px; }
    .day-cell:hover { background:var(--bg-elevated); }
    .day-cell.other-month { opacity:0.3; }
    .day-cell.today { background:var(--accent-glow); }
    .day-num { font-size:12px; font-weight:500; color:var(--text-secondary); width:24px; height:24px; display:flex; align-items:center; justify-content:center; border-radius:50%; }
    .day-num.today-num { background:var(--accent); color:#0c0c0e; font-weight:700; }
    .task-chip { font-size:11px; padding:2px 6px; border-radius:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .task-chip.low { background:rgba(74,222,128,0.15); color:var(--success); }
    .task-chip.medium { background:rgba(245,158,11,0.15); color:var(--warning); }
    .task-chip.high { background:rgba(239,68,68,0.15); color:var(--danger); }
    .task-chip.critical { background:rgba(255,51,51,0.2); color:#ff3333; }
    .more-chip { font-size:10px; color:var(--text-tertiary); padding-left:6px; }
    .legend { display:flex; gap:20px; align-items:center; }
    .legend-item { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-secondary); }
    .dot { width:8px; height:8px; border-radius:50%; }
    .dot.low { background:var(--success); }
    .dot.medium { background:var(--warning); }
    .dot.high { background:var(--danger); }
    .dot.critical { background:#ff3333; }
  `]
})
export default class CalendarComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);
  private readonly workspaceService = inject(WorkspaceService);
  tasks: Task[] = [];
  calendarDays: CalendarDay[] = [];
  loading = true;
  viewDate = new Date();
  readonly dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  get monthName(): string { return this.viewDate.toLocaleString('default',{month:'long'}); }
  get year(): number { return this.viewDate.getFullYear(); }
  ngOnInit(): void {
    this.workspaceService.getAll().pipe(
      switchMap(ws => ws.length ? forkJoin(ws.map(w => this.projectService.getByWorkspace(w.id))) : of([])),
      switchMap((pa: any) => { const projects = (pa as any[][]).flat(); return projects.length ? forkJoin(projects.map((p:any) => this.taskService.getByProject(p.id))) : of([]); })
    ).subscribe({ next: (ta: any) => { this.tasks = (ta as Task[][]).flat().filter(t => t.dueDate); this.buildCalendar(); this.loading = false; }, error: () => { this.loading = false; this.buildCalendar(); } });
  }
  buildCalendar(): void {
    const year = this.viewDate.getFullYear(), month = this.viewDate.getMonth(), today = new Date();
    const firstDay = new Date(year, month, 1), lastDay = new Date(year, month+1, 0);
    const days: CalendarDay[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push({ date: new Date(year, month, i - firstDay.getDay() + 1), isCurrentMonth: false, isToday: false, tasks: [] });
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({ date, isCurrentMonth: true, isToday: date.toDateString() === today.toDateString(), tasks: this.tasks.filter(t => { const due = new Date(t.dueDate!); return due.getFullYear()===year && due.getMonth()===month && due.getDate()===d; }) });
    }
    const rem = 7 - (days.length % 7);
    if (rem < 7) for (let i = 1; i <= rem; i++) days.push({ date: new Date(year, month+1, i), isCurrentMonth: false, isToday: false, tasks: [] });
    this.calendarDays = days;
  }
  prevMonth(): void { this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth()-1, 1); this.buildCalendar(); }
  nextMonth(): void { this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth()+1, 1); this.buildCalendar(); }
  goToday(): void { this.viewDate = new Date(); this.buildCalendar(); }
}
