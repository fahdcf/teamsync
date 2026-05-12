import { User } from './user.model';

export interface Comment {
  id: string;
  content: string;
  author: User;
  taskId: string;
  parentCommentId: string | null;
  replies: Comment[];
  createdAt: string;
}
