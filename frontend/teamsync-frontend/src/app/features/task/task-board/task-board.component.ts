import { Component, Input, OnInit, inject } from '@angular/core';
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

interface Column {
  status: TaskStatus;
  label: string;
  tasks: Task[];
}

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
  ],
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.scss',
})
export default class TaskBoardComponent implements OnInit {
  @Input() projectId = '';

  private readonly taskService = inject(TaskService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly keywordSubject = new Subject<string>();

  readonly router = inject(Router);

  columns: Column[] = [
    { status: 'TODO', label: 'To Do', tasks: [] },
    { status: 'IN_PROGRESS', label: 'In Progress', tasks: [] },
    { status: 'IN_REVIEW', label: 'Review', tasks: [] },
    { status: 'DONE', label: 'Done', tasks: [] },
  ];

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
    dueDate: [''],
  });

  get columnIds(): string[] {
    return this.columns.map((column) => column.status);
  }

  get hasFilters(): boolean {
    return !!(this.filters.keyword || this.filters.priority);
  }

  ngOnInit(): void {
    this.projectId = this.projectId || this.route.snapshot.paramMap.get('id') || '';
    this.loadTasks();
    this.keywordSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((keyword) => {
      this.filters = { ...this.filters, keyword: keyword || undefined };
      this.loadTasks();
    });
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
    this.router.navigate(['/tasks', task.id]);
  }

  commentCountFor(task: Task): number {
    return task.dependencies?.length ?? 0;
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
}
