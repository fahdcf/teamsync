import { User } from './user.model';

export interface Workspace {
  id: string;
  canManage?: boolean;
  canCreateProject?: boolean;

  name: string;
  description: string;
  owner: User;
  members: User[];
  createdAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description: string;
}
