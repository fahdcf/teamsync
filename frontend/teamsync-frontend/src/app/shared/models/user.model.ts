export type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
}
