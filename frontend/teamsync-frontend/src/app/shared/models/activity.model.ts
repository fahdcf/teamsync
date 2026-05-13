import { User } from './user.model';

export interface ActivityLog {
  id: string;
  action: string;
  user: User | null;
  entityType: string;
  entityId: string;
  createdAt: string;
}
