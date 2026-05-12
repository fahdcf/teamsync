import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly KEY = 'teamsync_token';

  getToken(): string | null {
    return localStorage.getItem(this.KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.KEY, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.KEY);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }
}
