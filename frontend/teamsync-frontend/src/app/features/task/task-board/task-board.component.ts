import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService } from '../../../api/task.service';
import { Task, TaskStatus, TaskPriority } from '../../../shared/models/task.model';
import { TaskCardComponent } from '../task-card/task-card.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { Router } from '@angular/router';

interface Column {
  status: TaskStatus;
  label: string;
  tasks: Task[];
}

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DragDropModule,
    TaskCardComponent, ModalComponent, ButtonComponent, InputComponent,
    EmptyStateComponent, SkeletonComponent
  ],
  template: `
    <!-- Filter bar -->
    <div class="filter-bar">
      <input class="search-input" placeholder="Search tasks…"
        (input)="onKeywordChange($event)" [value]="filters.keyword || ''">
      <select class="filter-select" (change)="onPriorityChange($event)">
        <option value="">All priorities</option>
        <option *ngFor="let p of priorities" [value]="p">{{ p }}</option>
      </select>
      <button *ngIf="hasFilters" class="clear-btn" (click)="clearFilters()">Clear</button>
    </div>

    <div *ngIf="isLoading" class="board board--skeleton">
      <div *ngFor="let col of columns" class="column">
        <app-skeleton type="list-item"></app-skeleton>
        <app-skeleton type="card"></app-skeleton>
        <app-skeleton type="card"></app-skeleton>
      </div>
    </div>

    <app-empty-state
      *ngIf="!isLoading && hasError"
      variant="error"
      description="Failed to load tasks"
      (action)="loadTasks()">
    </app-empty-state>

    <!-- Kanban board -->
    <div *ngIf="!isLoading && !hasError" class="board" cdkDropListGroup>
      <div *ngFor="let col of columns" class="column">
        <div class="column-header">
          <div class="col-title-row">
            <span class="status-dot" [class]="col.status.toLowerCase()"></span>
            <span class="column-title">{{ col.label }}</span>
            <span class="task-count">{{ col.tasks.length }}</span>
          </div>
          <button class="add-btn" (click)="openCreate(col.status)">+</button>
        </div>

        <div class="column-body"
          cdkDropList
          [id]="col.status"
          [cdkDropListData]="col.tasks"
          [cdkDropListConnectedTo]="columnIds"
          (cdkDropListDropped)="onDrop($event)">
          <div *ngFor="let task of col.tasks" cdkDrag [cdkDragData]="task">
            <app-task-card
              [task]="task"
              (cardClick)="router.navigate(['/tasks', task.id])"
              (deleted)="deleteTask(task)">
            </app-task-card>
          </div>
          <app-empty-state
            *ngIf="!col.tasks.length"
            title="" description="No tasks" [minimal]="true">
          </app-empty-state>
        </div>
      </div>
    </div>

    <!-- Create task modal -->
    <app-modal [isOpen]="isCreateModalOpen" title="New Task" (closed)="isCreateModalOpen = false">
      <form [formGroup]="createForm" (ngSubmit)="createTask()" class="form">
        <app-input label="Title" placeholder="Task title" formControlName="title"></app-input>
        <app-input label="Description" placeholder="Optional description" formControlName="description"></app-input>
        <div class="form-row">
          <div class="field">
            <label class="field-label">Priority</label>
            <select class="field-select" formControlName="priority">
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Due Date</label>
            <input type="date" class="field-select" formControlName="dueDate">
          </div>
        </div>
        <div class="form-actions">
          <app-button variant="secondary" size="sm" (click)="isCreateModalOpen = false">Cancel</app-button>
          <app-button type="submit" size="sm" [loading]="isCreating">Create Task</app-button>
        </div>
      </form>
    </app-modal>
  `,
  styles: [`
    .filter-bar {
      display: flex; align-items: center; gap: 8px; margin-bottom: 20px;
    }
    .search-input, .filter-select {
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); color: var(--color-text);
      padding: 8px 12px; font-size: 13px; outline: none;
    }
    .search-input { flex: 1; }
    .search-input:focus, .filter-select:focus { border-color: var(--color-accent); }
    .clear-btn {
      background: none; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); color: var(--color-muted);
      padding: 8px 12px; font-size: 13px;
    }
    .clear-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
    .board {
      display: flex; gap: 16px; overflow-x: auto; padding-bottom: 16px;
      min-height: calc(100vh - 220px);
    }
    .column { width: 240px; flex-shrink: 0; }
    .column-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 10px;
    }
    .col-title-row { display: flex; align-items: center; gap: 6px; }
    .status-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }
    .status-dot.todo        { background: var(--color-muted); }
    .status-dot.in_progress { background: var(--color-accent); }
    .status-dot.blocked     { background: var(--color-danger); }
    .status-dot.in_review   { background: var(--color-warning); }
    .status-dot.done        { background: var(--color-success); }
    .column-title { font-size: 13px; font-weight: 600; }
    .task-count {
      background: var(--color-border); color: var(--color-muted);
      border-radius: 100px; font-size: 11px; padding: 1px 7px;
    }
    .add-btn {
      background: none; border: none; color: var(--color-muted);
      font-size: 20px; line-height: 1; padding: 0;
    }
    .add-btn:hover { color: var(--color-accent); }
    .column-body {
      display: flex; flex-direction: column; gap: 8px;
      min-height: 80px;
    }
    .cdk-drag-placeholder { opacity: 0.4; }
    .cdk-drag-animating { transition: transform 250ms cubic-bezier(0,0,0.2,1); }
    .form { display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: flex; gap: 12px; }
    .field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .field-label { font-size: 13px; font-weight: 500; color: var(--color-muted); }
    .field-select {
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); color: var(--color-text); padding: 10px 12px; font-size: 14px; outline: none;
    }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
  `]
})
export default class TaskBoardComponent implements OnInit {
  @Input() projectId = '';
  private readonly taskService = inject(TaskService);
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly keywordSubject = new Subject<string>();

  columns: Column[] = [
    { status: 'TODO',        label: 'To Do',       tasks: [] },
    { status: 'IN_PROGRESS', label: 'In Progress',  tasks: [] },
    { status: 'BLOCKED',     label: 'Blocked',      tasks: [] },
    { status: 'IN_REVIEW',   label: 'In Review',    tasks: [] },
    { status: 'DONE',        label: 'Done',         tasks: [] },
  ];

  get columnIds(): string[] { return this.columns.map(c => c.status); }

  filters: { keyword?: string; priority?: string } = {};
  priorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  isLoading = true;
  hasError = false;
  isCreateModalOpen = false;
  isCreating = false;
  selectedStatus: TaskStatus = 'TODO';

  createForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    priority: ['MEDIUM' as TaskPriority],
    dueDate: ['']
  });

  get hasFilters(): boolean {
    return !!(this.filters.keyword || this.filters.priority);
  }

  ngOnInit(): void {
    this.loadTasks();
    this.keywordSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(kw => {
      this.filters = { ...this.filters, keyword: kw || undefined };
      this.loadTasks();
    });
  }

  loadTasks(): void {
    this.isLoading = true;
    this.hasError = false;
    this.taskService.getByProject(this.projectId, this.filters).subscribe({
      next: tasks => {
        this.columns.forEach(col => col.tasks = tasks.filter(t => t.status === col.status));
        this.isLoading = false;
      },
      error: () => { this.hasError = true; this.isLoading = false; }
    });
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }
    const task = event.previousContainer.data[event.previousIndex];
    const newStatus = event.container.id as TaskStatus;
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.taskService.changeStatus(task.id, { status: newStatus }).subscribe({
      error: () => {
        transferArrayItem(event.container.data, event.previousContainer.data, event.currentIndex, event.previousIndex);
        alert('Invalid status transition');
      }
    });
  }

  openCreate(status: TaskStatus): void {
    this.selectedStatus = status;
    this.isCreateModalOpen = true;
  }

  createTask(): void {
    if (this.createForm.invalid) return;
    this.isCreating = true;
    const { title, description, priority, dueDate } = this.createForm.value;
    this.taskService.create(this.projectId, {
      title: title!, description: description || '', priority: priority as TaskPriority,
      dueDate: dueDate || undefined
    }).subscribe({
      next: task => {
        const col = this.columns.find(c => c.status === task.status);
        if (col) col.tasks.unshift(task);
        this.isCreateModalOpen = false;
        this.createForm.reset({ priority: 'MEDIUM' });
        this.isCreating = false;
      },
      error: () => { this.isCreating = false; }
    });
  }

  deleteTask(task: Task): void {
    this.taskService.delete(task.id).subscribe({
      next: () => {
        const col = this.columns.find(c => c.status === task.status);
        if (col) col.tasks = col.tasks.filter(t => t.id !== task.id);
      }
    });
  }

  onKeywordChange(event: Event): void {
    this.keywordSubject.next((event.target as HTMLInputElement).value);
  }

  onPriorityChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.filters = { ...this.filters, priority: val || undefined };
    this.loadTasks();
  }

  clearFilters(): void {
    this.filters = {};
    this.loadTasks();
  }
}
