import { Component, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { NotificationStore } from '../../store/notification.store';
import { TokenService } from '../../core/services/token.service';
import { SidebarStateService } from '../../core/services/sidebar-state.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, AsyncPipe, AvatarComponent, ClickOutsideDirective, RelativeTimePipe],
  template: `
    <nav class="navbar">
      <div class="navbar-left">
        <button class="hamburger" (click)="sidebarState.toggle()" aria-label="Toggle menu">☰</button>
        <span class="page-title">TeamSync</span>
      </div>

      <div class="navbar-right">
        <!-- Notification bell -->
        <div class="notif-trigger"
             appClickOutside
             (clickOutside)="isNotifOpen = false"
             (click)="isNotifOpen = !isNotifOpen">
          <span class="bell-icon">🔔</span>
          <span class="badge-count" *ngIf="(unreadCount$ | async)! > 0">
            {{ unreadCount$ | async }}
          </span>

          <div class="notif-dropdown" *ngIf="isNotifOpen" (click)="$event.stopPropagation()">
            <div class="notif-header">
              <span>Notifications</span>
              <button class="mark-read-btn" (click)="notifStore.markAllRead()">Mark all read</button>
            </div>
            <div *ngFor="let n of (notifications$ | async)"
                 class="notif-item"
                 [class.unread]="!n.readStatus"
                 (click)="notifStore.markRead(n.id)">
              <span class="notif-msg">{{ n.message }}</span>
              <span class="notif-time">{{ n.createdAt | relativeTime }}</span>
            </div>
            <div *ngIf="!(notifications$ | async)?.length" class="notif-empty">
              You're all caught up!
            </div>
          </div>
        </div>

        <!-- User menu -->
        <div class="user-menu"
             appClickOutside
             (clickOutside)="isUserMenuOpen = false">
          <div (click)="isUserMenuOpen = !isUserMenuOpen">
            <app-avatar [user]="(user$ | async)!" size="sm"></app-avatar>
          </div>
          <div class="user-dropdown" *ngIf="isUserMenuOpen">
            <button (click)="logout()" class="logout-btn">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px; height: 60px;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }
    .hamburger {
      display: none; background: none; border: none;
      color: var(--color-text); font-size: 22px; padding: 4px; line-height: 1;
    }
    @media (max-width: 767px) { .hamburger { display: block; } }
    .page-title { font-weight: 700; font-size: 16px; }
    .navbar-right { display: flex; align-items: center; gap: 16px; }
    .notif-trigger {
      position: relative; cursor: pointer;
      display: flex; align-items: center;
    }
    .bell-icon { font-size: 20px; }
    .badge-count {
      position: absolute; top: -6px; right: -6px;
      background: var(--color-danger); color: #fff;
      border-radius: 50%; width: 18px; height: 18px;
      font-size: 10px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .notif-dropdown {
      position: absolute; top: calc(100% + 12px); right: 0;
      width: 320px; background: var(--color-surface);
      border: 1px solid var(--color-border); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg); z-index: 200;
    }
    .notif-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid var(--color-border);
      font-weight: 600; font-size: 14px;
    }
    .mark-read-btn {
      background: none; border: none; color: var(--color-accent);
      font-size: 12px; cursor: pointer;
    }
    .notif-item {
      display: flex; flex-direction: column; gap: 2px;
      padding: 10px 16px; cursor: pointer;
      border-bottom: 1px solid var(--color-border);
      transition: background 0.1s;
    }
    .notif-item:hover { background: rgba(255,255,255,0.04); }
    .notif-item.unread { background: rgba(99,102,241,0.06); }
    .notif-msg { font-size: 13px; }
    .notif-time { font-size: 11px; color: var(--color-muted); }
    .notif-empty { padding: 20px; text-align: center; color: var(--color-muted); font-size: 13px; }
    .user-menu { position: relative; cursor: pointer; }
    .user-dropdown {
      position: absolute; top: calc(100% + 8px); right: 0;
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); box-shadow: var(--shadow-md); z-index: 200;
      min-width: 120px;
    }
    .logout-btn {
      display: block; width: 100%; padding: 10px 16px;
      background: none; border: none; color: var(--color-danger);
      text-align: left; font-size: 14px;
    }
    .logout-btn:hover { background: rgba(239,68,68,0.08); }
  `]
})
export class NavbarComponent {
  readonly authStore = inject(AuthStore);
  readonly notifStore = inject(NotificationStore);
  readonly sidebarState = inject(SidebarStateService);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  readonly user$ = this.authStore.user$;
  readonly notifications$ = this.notifStore.notifications$;
  readonly unreadCount$ = this.notifStore.unreadCount$;

  isNotifOpen = false;
  isUserMenuOpen = false;

  logout(): void {
    this.authStore.clearUser();
    this.tokenService.removeToken();
    this.router.navigate(['/login']);
  }
}
