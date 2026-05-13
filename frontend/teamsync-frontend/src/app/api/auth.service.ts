import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, LoginRequest, RegisterRequest, LoginResponse } from '../shared/models/user.model';

export interface AccountOverview {
  profileCompletion: number;
  securityStatus: string;
  securityMessage: string;
  missingProfileFields: string[];
}

export interface UserPreferences {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  taskReminders: boolean;
  weeklyDigest: boolean;
  theme: 'system' | 'dark' | 'light';
  density: 'comfortable' | 'compact';
  reduceMotion: boolean;
}

export interface SecurityOverview {
  role: User['role'];
  memberSince: string;
  passwordUpdatedAt: string;
  activeSessionCount: number;
  sessionMode: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, req);
  }

  register(req: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.base}/auth/register`, req);
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.base}/users/me`);
  }

  getAccountOverview(): Observable<AccountOverview> {
    return this.http.get<AccountOverview>(`${this.base}/users/me/account-overview`);
  }

  getPreferences(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(`${this.base}/users/me/preferences`);
  }

  updatePreferences(data: Partial<UserPreferences>): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(`${this.base}/users/me/preferences`, data);
  }

  getSecurityOverview(): Observable<SecurityOverview> {
    return this.http.get<SecurityOverview>(`${this.base}/users/me/security`);
  }

  changePassword(data: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/users/me/password`, data);
  }

  updateMe(data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.base}/users/me`, data);
  }
}
