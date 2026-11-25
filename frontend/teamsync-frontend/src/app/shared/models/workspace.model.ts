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
  starterKit?: string;
}

export const WORKSPACE_STARTER_KITS = [
  { value: 'SOFTWARE_DEVELOPMENT', label: 'Software development' },
  { value: 'UNIVERSITY_PROJECT', label: 'University project' },
  { value: 'EVENT_PLANNING', label: 'Event planning' },
];
