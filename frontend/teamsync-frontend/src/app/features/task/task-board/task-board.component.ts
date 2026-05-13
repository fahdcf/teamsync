import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { TaskService } from '../../../api/task.service';
import { Task, TaskStatus, TaskPriority } from '../../../shared/models/task.model';
import { TaskCardComponent } from '../task-card/task-card.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import TaskDetailComponent from '../task-detail/task-detail.component';

interface Column {
  status: TaskStatus;
  label: string;
  tasks: Task[];
}

export interface TaskBoardFilters {
  keyword?: string;
  priority?: TaskPriority | '';
  overdue?: boolean;
}

export type TaskBoardSort = 'position' | 'updated' | 'dueDate' | 'priority' | 'title';
export type TaskBoardGroup = 'status' | 'priority';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    TaskCardComponent,
    ModalComponent,
    ButtonComponent,
    InputComponent,
    EmptyStateComponent,
    SkeletonComponent,
    TaskDetailComponent,
  ],
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.scss',
})
export default class TaskBoardComponent implements OnInit, OnChanges {
  @Input() projectId = '';
  @Input() externalFilters: TaskBoardFilters = {};
  @Input() sortMode: TaskBoardSort = 'position';
  @Input() groupMode: TaskBoardGroup = 'status';
  @Input() refreshToken = 0;

  private readonly taskService = inject(TaskService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly keywordSubject = new Subject<string>();
  private initialized = false;

  readonly router = inject(Router);

  columns: Column[] = [
    { status: 'TODO', label: 'To Do', tasks: [] },
    { status: 'IN_PROGRESS', label: 'In Progress', tasks: [] },
    { status: 'IN_REVIEW', label: 'Review', tasks: [] },
    { status: 'DONE', label: 'Done', tasks: [] },
  ];

  filters: { keyword?: string; priority?: string; overdue?: boolean } = {};
  priorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  isLoading = true;
  hasError = false;
  isCreateModalOpen = false;
  isCreating = false;
  selectedStatus: TaskStatus = 'TODO';
  selectedTaskId: string | null = null;

  createForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    priority: ['MEDIUM' as TaskPriority],
    dueDate: [''],
  });

  get columnIds(): string[] {
    return this.columns.map((column) => column.status);
  }

  get hasFilters(): boolean {
    return !!(this.filters.keyword || this.filters.priority || this.filters.overdue);
  }

  get groupedPriorities(): TaskPriority[] {
    return ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  }

  ngOnInit(): void {
    this.projectId = this.projectId || this.route.snapshot.paramMap.get('id') || '';
    this.applyExternalFilters();
    this.initialized = true;
    this.loadTasks();
    this.keywordSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((keyword) => {
      this.filters = { ...this.filters, keyword: keyword || undefined };
      this.loadTasks();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;
    if (!this.projectId) return;

    if (changes['externalFilters']) {
      this.applyExternalFilters();
      this.loadTasks();
      return;
    }

    if (changes['sortMode'] && !changes['sortMode'].firstChange) {
      this.sortColumns();
    }

    if (changes['refreshToken'] && !changes['refreshToken'].firstChange) {
      this.loadTasks();
    }
  }

  loadTasks(): void {
    if (!this.projectId) {
      this.hasError = true;
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.taskService.getByProject(this.projectId, this.filters).subscribe({
      next: (tasks) => {
        this.columns.forEach((column) => {
          column.tasks = tasks.filter((task) => task.status === column.status);
        });
        this.sortColumns();
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.persistColumnOrder(event.container.data);
      return;
    }

    const task = event.previousContainer.data[event.previousIndex];
    const newStatus = event.container.id as TaskStatus;
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

    this.taskService.changeStatus(task.id, { status: newStatus }).subscribe({
      error: () => {
        transferArrayItem(event.container.data, event.previousContainer.data, event.currentIndex, event.previousIndex);
        alert('Invalid status transition');
      },
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

    this.taskService
      .create(this.projectId, {
        title: title!,
        description: description || '',
        priority: priority as TaskPriority,
        status: this.selectedStatus,
        dueDate: dueDate || undefined,
      })
      .subscribe({
        next: (task) => {
          const column = this.columns.find((candidate) => candidate.status === task.status);
          if (column) column.tasks.unshift(task);
          this.isCreateModalOpen = false;
          this.createForm.reset({ priority: 'MEDIUM' });
          this.isCreating = false;
        },
        error: () => {
          this.isCreating = false;
        },
      });
  }

  deleteTask(task: Task): void {
    this.taskService.delete(task.id).subscribe({
      next: () => {
        const column = this.columns.find((candidate) => candidate.status === task.status);
        if (column) column.tasks = column.tasks.filter((candidate) => candidate.id !== task.id);
      },
    });
  }

  openTask(task: Task): void {
    this.selectedTaskId = task.id;
  }

  closeTask(): void {
    this.selectedTaskId = null;
  }

  commentCountFor(task: Task): number {
    return task.commentCount ?? 0;
  }

  onKeywordChange(event: Event): void {
    this.keywordSubject.next((event.target as HTMLInputElement).value);
  }

  onPriorityChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filters = { ...this.filters, priority: value || undefined };
    this.loadTasks();
  }

  clearFilters(): void {
    this.filters = {};
    this.loadTasks();
  }

  tasksByPriority(tasks: Task[], priority: TaskPriority): Task[] {
    return tasks.filter((task) => task.priority === priority);
  }

  priorityLabel(priority: TaskPriority): string {
    return priority.charAt(0) + priority.slice(1).toLowerCase();
  }

  private applyExternalFilters(): void {
    this.filters = {
      keyword: this.externalFilters.keyword || undefined,
      priority: this.externalFilters.priority || undefined,
      overdue: this.externalFilters.overdue || undefined,
    };
  }

  private sortColumns(): void {
    this.columns.forEach((column) => {
      column.tasks = [...column.tasks].sort((a, b) => this.compareTasks(a, b));
    });
  }

  private compareTasks(a: Task, b: Task): number {
    if (this.sortMode === 'position') {
      return (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER);
    }
    if (this.sortMode === 'dueDate') {
      return this.dateValue(a.dueDate, Number.MAX_SAFE_INTEGER) - this.dateValue(b.dueDate, Number.MAX_SAFE_INTEGER);
    }
    if (this.sortMode === 'priority') {
      return this.priorityValue(b.priority) - this.priorityValue(a.priority);
    }
    if (this.sortMode === 'title') {
      return a.title.localeCompare(b.title);
    }
    return this.dateValue(b.updatedAt || b.createdAt, 0) - this.dateValue(a.updatedAt || a.createdAt, 0);
  }

  private priorityValue(priority: TaskPriority): number {
    return { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }[priority];
  }

  private dateValue(value: string | null | undefined, fallback: number): number {
    return value ? new Date(value).getTime() : fallback;
  }

  private persistColumnOrder(tasks: Task[]): void {
    tasks.forEach((task, index) => (task.position = index));
    this.taskService.reorder(this.projectId, tasks.map((task) => task.id)).subscribe({
      error: () => this.loadTasks(),
    });
  }
}
