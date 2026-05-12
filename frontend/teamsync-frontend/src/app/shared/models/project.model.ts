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
  workspace: Workspace;
  manager: User;
  createdAt: string;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  deadline: string;
  managerId: string;
}
