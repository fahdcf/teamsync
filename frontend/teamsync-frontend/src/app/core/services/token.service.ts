import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly KEY = 'teamsync_token';

  constructor() {
    localStorage.removeItem(this.KEY);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.KEY);
  }

  setToken(token: string): void {
    sessionStorage.setItem(this.KEY, token);
  }

  removeToken(): void {
    sessionStorage.removeItem(this.KEY);
  }

  hasToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token');
      const claims = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (typeof claims.exp === 'number' && claims.exp * 1000 > Date.now()) return true;
    } catch { /* Invalid stored credentials require a fresh sign-in. */ }
    this.removeToken();
    return false;
  }
}
