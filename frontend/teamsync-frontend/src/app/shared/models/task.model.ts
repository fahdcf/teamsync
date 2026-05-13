import { User } from './user.model';
import { Project } from './project.model';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Task {
  id: string;
  taskIdentifier?: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: User | null;
  project: Project;
  projectId?: string;
  projectTitle?: string;
  workspaceId?: string;
  workspaceName?: string;
  dependencies: Task[];
  subtasks?: Subtask[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  taskId: string;
  assignee: User | null;
  dueDate: string | null;
  createdAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
}

export interface ChangeStatusRequest {
  status: TaskStatus;
}

export interface CreateSubtaskRequest {
  title: string;
  assigneeId?: string;
  dueDate?: string;
}
