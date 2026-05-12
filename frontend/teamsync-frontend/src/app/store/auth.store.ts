import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { User } from '../shared/models/user.model';
import { AuthService } from '../api/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authService = inject(AuthService);
  private readonly userSubject = new BehaviorSubject<User | null>(null);

  readonly user$ = this.userSubject.asObservable();
  readonly isAuthenticated$ = this.user$.pipe(map(u => u !== null));

  setUser(user: User): void {
    this.userSubject.next(user);
  }

  clearUser(): void {
    this.userSubject.next(null);
  }

  getUser(): User | null {
    return this.userSubject.value;
  }

  init(): Observable<void> {
    return this.authService.getMe().pipe(
      tap(user => this.setUser(user)),
      map(() => void 0)
    );
  }
}
