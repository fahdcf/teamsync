import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskService } from '../../../api/task.service';
import { CommentService } from '../../../api/comment.service';
import { ProjectService } from '../../../api/project.service';
import { WorkspaceService, WorkspaceActivity } from '../../../api/workspace.service';
import { AuthStore } from '../../../store/auth.store';
import { Task, TaskStatus, TaskPriority, Subtask } from '../../../shared/models/task.model';
import { Comment } from '../../../shared/models/comment.model';
import { User } from '../../../shared/models/user.model';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { slideInRight } from '../../../app.animations';

type TaskDetailTab = 'comments' | 'activity' | 'files' | 'assistant';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, SkeletonComponent, EmptyStateComponent],
  animations: [slideInRight],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss',
})
export default class TaskDetailComponent implements OnInit {
  @Input() taskId = '';
  @Output() closed = new EventEmitter<void>();

  private readonly taskService = inject(TaskService);
  private readonly commentService = inject(CommentService);
  private readonly projectService = inject(ProjectService);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  task: Task | null = null;
  comments: Comment[] = [];
  activity: WorkspaceActivity[] = [];
  projectName = 'Project';
  workspaceId = '';
  assigneeOptions: User[] = [];
  isLoading = true;
  hasError = false;
  isEditingTitle = false;
  isEditingDescription = false;
  isAddingSubtask = false;
  activeTab: TaskDetailTab = 'comments';
  newSubtaskTitle = '';
  newCommentText = '';
  replyingToId: string | null = null;
  replyText = '';
  showAssigneePicker = false;
  showOptionsMenu = false;
  dependencyTaskId = '';
  actionMessage = '';

  readonly statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'DONE'];
  readonly priorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  readonly tabs: { key: TaskDetailTab; label: string }[] = [
    { key: 'comments', label: 'Comments' },
    { key: 'activity', label: 'Activity' },
    { key: 'files', label: 'Files' },
    { key: 'assistant', label: 'AI Assistant' },
  ];

  get currentUser(): User | null {
    return this.authStore.getUser();
  }

  get canDelete(): boolean {
    const role = this.authStore.getUser()?.role;
    return role === 'ADMIN' || role === 'PROJECT_MANAGER';
  }

  get subtasks(): Subtask[] {
    return this.task?.subtasks ?? [];
  }

  get completedSubtasks(): number {
    return this.subtasks.filter((subtask) => subtask.completed).length;
  }

  get subtaskProgress(): number {
    if (!this.subtasks.length) return 0;
    return Math.round((this.completedSubtasks / this.subtasks.length) * 100);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.hasError = false;
    const id = this.taskId || this.route.snapshot.paramMap.get('id') || '';

    this.taskService.getById(id).subscribe({
      next: (task) => {
        this.task = task;
        this.loadProject(task);
        this.loadComments(id);
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  closeDrawer(): void {
    this.closed.emit();
    if (!this.closed.observed) {
      this.location.back();
    }
  }

  expandTask(): void {
    if (!this.task) return;
    this.closed.emit();
    this.router.navigate(['/tasks', this.task.id]);
  }

  toggleOptionsMenu(): void {
    this.showOptionsMenu = !this.showOptionsMenu;
    this.actionMessage = '';
  }

  startSubtaskCreate(): void {
    this.isAddingSubtask = true;
  }

  loadProject(task: Task): void {
    const projectId = task.projectId || task.project?.id;
    if (!projectId) return;

    this.projectService.getById(projectId).subscribe({
      next: (project) => {
        this.projectName = project.title;
        this.workspaceId = project.workspaceId || project.workspace?.id || '';
        this.setAssigneeOptions(project.manager ? [project.manager] : []);
        if (this.workspaceId) {
          this.loadActivity();
          this.loadAssigneeOptions(project.manager ? [project.manager] : []);
        }
      },
    });
  }

  loadActivity(): void {
    if (!this.workspaceId || !this.task) return;
    this.workspaceService.getActivity(this.workspaceId).subscribe({
      next: (items) => {
        this.activity = items.filter((item) => item.entityId === this.task?.id);
      },
      error: () => {
        this.activity = [];
      },
    });
  }

  loadComments(taskId: string): void {
    this.commentService.getByTask(taskId).subscribe({
      next: (comments) => {
        this.comments = comments;
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  onTitleBlur(event: Event): void {
    this.isEditingTitle = false;
    const value = (event.target as HTMLInputElement).value.trim();
    if (value && value !== this.task?.title) {
      this.taskService.update(this.task!.id, { title: value }).subscribe({ next: (task) => (this.task = task) });
    }
  }

  onDescBlur(event: Event): void {
    this.isEditingDescription = false;
    const value = (event.target as HTMLTextAreaElement).value.trim();
    if (value !== this.task?.description) {
      this.taskService.update(this.task!.id, { description: value }).subscribe({ next: (task) => (this.task = task) });
    }
  }

  onStatusChange(status: TaskStatus): void {
    if (!this.task || status === this.task.status) return;
    this.taskService.changeStatus(this.task.id, { status }).subscribe({ next: (task) => (this.task = task) });
  }

  onPriorityChange(priority: TaskPriority): void {
    if (!this.task || priority === this.task.priority) return;
    this.taskService.update(this.task.id, { priority }).subscribe({ next: (task) => (this.task = task) });
  }

  onDueDateChange(date: string): void {
    if (!this.task) return;
    this.taskService.update(this.task.id, { dueDate: date }).subscribe({ next: (task) => (this.task = task) });
  }

  onAssigneeChange(userId: string): void {
    if (!this.task || !userId || userId === this.task.assignee?.id) return;
    this.taskService.assign(this.task.id, userId).subscribe({ next: (task) => (this.task = task) });
  }

  addSubtask(): void {
    const title = this.newSubtaskTitle.trim();
    if (!this.task || !title) return;

    this.taskService.createSubtask(this.task.id, { title }).subscribe({
      next: (subtask) => {
        this.task = { ...this.task!, subtasks: [...this.subtasks, subtask] };
        this.newSubtaskTitle = '';
        this.isAddingSubtask = false;
      },
    });
  }

  toggleSubtask(subtask: Subtask): void {
    if (!this.task) return;
    this.taskService.toggleSubtask(this.task.id, subtask.id).subscribe({
      next: (updated) => {
        this.task = {
          ...this.task!,
          subtasks: this.subtasks.map((candidate) => (candidate.id === updated.id ? updated : candidate)),
        };
      },
    });
  }

  deleteSubtask(subtask: Subtask): void {
    if (!this.task) return;
    this.taskService.deleteSubtask(this.task.id, subtask.id).subscribe({
      next: () => {
        this.task = {
          ...this.task!,
          subtasks: this.subtasks.filter((candidate) => candidate.id !== subtask.id),
        };
      },
    });
  }

  cancelSubtask(event?: Event): void {
    if (event) event.preventDefault();
    this.newSubtaskTitle = '';
    this.isAddingSubtask = false;
  }

  submitComment(): void {
    if (!this.task || !this.newCommentText.trim()) return;
    this.commentService.add(this.task.id, this.newCommentText).subscribe({
      next: (comment) => {
        this.comments = [comment, ...this.comments];
        this.newCommentText = '';
      },
    });
  }

  startReply(commentId: string): void {
    this.replyingToId = commentId;
    this.replyText = '';
  }

  cancelReply(): void {
    this.replyingToId = null;
    this.replyText = '';
  }

  submitReply(commentId: string): void {
    if (!this.replyText.trim()) return;
    this.commentService.reply(commentId, this.replyText).subscribe({
      next: (reply) => {
        this.comments = this.comments.map((comment) =>
          comment.id === commentId ? { ...comment, replies: [...(comment.replies || []), reply] } : comment
        );
        this.replyingToId = null;
        this.replyText = '';
      },
    });
  }

  deleteComment(commentId: string): void {
    this.commentService.delete(commentId).subscribe({
      next: () => {
        this.comments = this.comments.filter((comment) => comment.id !== commentId);
      },
    });
  }

  canDeleteComment(comment: Comment): boolean {
    const user = this.authStore.getUser();
    return user?.id === comment.author.id || user?.role === 'ADMIN';
  }

  undoLastAction(): void {
    if (!this.task) return;
    this.taskService.undo().subscribe({
      next: () => {
        this.taskService.getById(this.task!.id).subscribe({ next: (task) => (this.task = task) });
        this.showOptionsMenu = false;
      },
    });
  }

  deleteTask(): void {
    if (!this.task) return;
    this.taskService.delete(this.task.id).subscribe({ next: () => this.closeDrawer() });
  }

  copyLink(): void {
    navigator.clipboard?.writeText(window.location.href);
  }

  duplicateTask(): void {
    if (!this.task) return;
    const projectId = this.task.projectId || this.task.project?.id;
    if (!projectId) return;

    this.taskService.create(projectId, {
      title: `${this.task.title} copy`,
      description: this.task.description || '',
      priority: this.task.priority,
      status: this.task.status,
      dueDate: this.task.dueDate || undefined,
      assigneeId: this.task.assignee?.id,
    }).subscribe({
      next: (task) => {
        this.showOptionsMenu = false;
        this.router.navigate(['/tasks', task.id]);
      },
    });
  }

  saveTaskAsTemplate(): void {
    if (!this.task) return;
    const projectId = this.task.projectId || this.task.project?.id;
    if (!projectId) return;

    this.taskService.saveTemplate(projectId, {
      templateName: `${this.task.title} template`,
      title: this.task.title,
      description: this.task.description || '',
      priority: this.task.priority,
      defaultDueDays: 7,
    }).subscribe({
      next: () => {
        this.actionMessage = 'Template saved';
      },
    });
  }

  addDependencyFromMenu(): void {
    const dependsOnId = this.dependencyTaskId.trim();
    if (!this.task || !dependsOnId) return;

    this.taskService.addDependency(this.task.id, dependsOnId).subscribe({
      next: () => {
        this.dependencyTaskId = '';
        this.actionMessage = 'Dependency added';
        this.taskService.getById(this.task!.id).subscribe({ next: (task) => (this.task = task) });
      },
    });
  }

  statusLabel(status: TaskStatus): string {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  priorityLabel(priority: TaskPriority): string {
    return priority.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  dotClass(value: string): string {
    return value.toLowerCase();
  }

  initials(user: User | null | undefined): string {
    if (!user?.username) return '?';
    return user.username
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  private loadAssigneeOptions(seedUsers: User[]): void {
    if (!this.workspaceId) {
      this.setAssigneeOptions(seedUsers);
      return;
    }

    this.workspaceService.getById(this.workspaceId).subscribe({
      next: (workspace) => {
        this.setAssigneeOptions([
          ...seedUsers,
          ...(workspace.owner ? [workspace.owner] : []),
          ...(workspace.members || []),
        ]);
      },
      error: () => this.setAssigneeOptions(seedUsers),
    });
  }

  private setAssigneeOptions(users: User[]): void {
    const unique = new Map<string, User>();
    users.forEach((user) => unique.set(user.id, user));
    if (this.task?.assignee) unique.set(this.task.assignee.id, this.task.assignee);
    this.assigneeOptions = [...unique.values()].sort((a, b) => a.username.localeCompare(b.username));
  }
}
