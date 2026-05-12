import { User } from './user.model';
import { Project } from './project.model';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: User | null;
  project: Project;
  dependencies: Task[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
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
