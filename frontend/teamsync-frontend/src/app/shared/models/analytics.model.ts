import { User } from './user.model';
import { TaskStatus, TaskPriority } from './task.model';

export interface ProjectStats {
  projectId?: string;
  totalTasks: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  overdueCount: number;
  completionPercent: number;
  completionRate?: number;
  teamVelocity?: number;
  workloadBalance?: 'Balanced' | 'Overloaded' | 'Underutilized';
  projectsHealth?: number;
  sprintVelocityHistory?: SprintVelocityPoint[];
  workloadDistribution?: WorkloadDistribution[];
}

export interface TeamWorkload {
  member: User;
  userId?: string;
  name?: string;
  activeTaskCount: number;
  completedTaskCount: number;
}

export type ProjectHealth = 'ON_TRACK' | 'AT_RISK' | 'DELAYED';

export interface SprintVelocityPoint {
  sprint: string;
  value: number;
}

export interface WorkloadDistribution {
  category: string;
  count: number;
  percent: number;
}

export interface TeamPerformance {
  completionRate: number;
  trendCompletion: number;
  teamVelocity: number;
  trendVelocity: number;
  workloadBalance: 'Balanced' | 'Overloaded' | 'Underutilized';
  projectsHealth: number;
  trendHealth: number;
  teamProductivity: { tasksCompleted: number; trend: number };
  focusTime: { hours: number; trend: number };
  cycleTime: { days: number; trend: number };
  onTimeDelivery: { percent: number; trend: number };
}

export interface AnalyticsInsight {
  type: 'warning' | 'success' | 'info';
  title: string;
  description: string;
  action: string;
  actionUrl?: string;
}
