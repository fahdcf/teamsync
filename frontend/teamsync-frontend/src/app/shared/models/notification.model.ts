import { User } from './user.model';

export type NotificationType = 'IN_APP' | 'EMAIL';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  recipient: User;
  readStatus: boolean;
  createdAt: string;
}
