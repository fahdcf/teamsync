import { User } from './user.model';
import { TaskStatus, TaskPriority } from './task.model';

export interface ProjectStats {
  totalTasks: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  overdueCount: number;
  completionPercent: number;
}

export interface TeamWorkload {
  member: User;
  activeTaskCount: number;
  completedTaskCount: number;
}

export type ProjectHealth = 'ON_TRACK' | 'AT_RISK' | 'DELAYED';
