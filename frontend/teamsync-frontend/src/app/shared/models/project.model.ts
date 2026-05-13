import { User } from './user.model';
import { Workspace } from './workspace.model';

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  deadline: string;
  progress: number;
  taskCount?: number;
  health?: 'ON_TRACK' | 'AT_RISK' | 'DELAYED';
  insight?: string;
  favorite?: boolean;
  workspace: Workspace;
  workspaceId?: string;
  workspaceName?: string;
  manager: User;
  createdAt: string;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
  deadline?: string | null;
  managerId?: string | null;
  progress?: number;
}
