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

      <!-- Left: breadcrumb -->
      <div class="navbar-left">
        <button class="hamburger" (click)="sidebarState.toggle()" aria-label="Toggle menu">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect y="2" width="16" height="1.5" rx="0.75"/>
            <rect y="7" width="16" height="1.5" rx="0.75"/>
            <rect y="12" width="16" height="1.5" rx="0.75"/>
          </svg>
        </button>
        <div class="breadcrumb">
          <span class="breadcrumb-item">TeamSync</span>
        </div>
      </div>

      <!-- Center: search -->
      <div class="search-bar">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="6" cy="6" r="4"/>
          <path d="M9.5 9.5l3 3" stroke-linecap="round"/>
        </svg>
        <input type="text" class="search-input" placeholder="Search projects, tasks, people...">
        <span class="search-shortcut">/</span>
      </div>

      <!-- Right: actions -->
      <div class="navbar-right">

        <!-- +New button -->
        <button class="new-btn">
          + New
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/>
          </svg>
        </button>

        <!-- Notification bell -->
        <div class="notif-trigger"
             appClickOutside
             (clickOutside)="isNotifOpen = false"
             (click)="isNotifOpen = !isNotifOpen">
          <button class="icon-btn" aria-label="Notifications">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M8 2a5 5 0 00-5 5v3l-1 1h12l-1-1V7a5 5 0 00-5-5z"/>
              <path d="M6.5 13a1.5 1.5 0 003 0"/>
            </svg>
            <span class="notif-badge" *ngIf="(unreadCount$ | async)! > 0">
              {{ unreadCount$ | async }}
            </span>
          </button>

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
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 20px;
      height: 52px;
      background: var(--bg-base);
      border-bottom: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }

    /* Left */
    .navbar-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 0 0 auto;
    }
    .hamburger {
      display: none;
      background: none;
      border: none;
      color: var(--text-secondary);
      padding: 6px;
      border-radius: var(--radius-md);
      cursor: pointer;
      align-items: center;
      justify-content: center;
    }
    .hamburger:hover { background: var(--bg-elevated); color: var(--text-primary); }
    @media (max-width: 767px) { .hamburger { display: flex; } }
    .breadcrumb { display: flex; align-items: center; gap: 4px; }
    .breadcrumb-item {
      font-size: 13px;
      color: var(--text-secondary);
    }
    .breadcrumb-item:last-child { color: var(--text-primary); }
    .breadcrumb-sep { font-size: 13px; color: var(--text-tertiary); }

    /* Search */
    .search-bar {
      flex: 0 0 320px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      height: 32px;
      padding: 0 12px;
      transition: border-color 0.15s;
    }
    .search-bar:focus-within { border-color: var(--border-default); }
    .search-icon { color: var(--text-tertiary); flex-shrink: 0; }
    .search-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      font-size: 13px;
      color: var(--text-secondary);
      min-width: 0;
    }
    .search-input::placeholder { color: var(--text-tertiary); }
    .search-shortcut {
      font-size: 11px;
      color: var(--text-tertiary);
      background: var(--bg-overlay);
      border: 1px solid var(--border-subtle);
      border-radius: 3px;
      padding: 1px 5px;
      flex-shrink: 0;
    }

    /* Right */
    .navbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }
    .new-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      height: 32px;
      padding: 0 14px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-size: 13px;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .new-btn:hover { background: var(--bg-overlay); border-color: var(--border-strong); }
    .icon-btn {
      position: relative;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .icon-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }
    .notif-badge {
      position: absolute;
      top: 4px; right: 4px;
      width: 8px; height: 8px;
      background: var(--danger);
      border-radius: 50%;
      font-size: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    /* Notification dropdown */
    .notif-trigger { position: relative; }
    .notif-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 320px;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      z-index: 200;
    }
    .notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-subtle);
      font-weight: 600;
      font-size: 13px;
      color: var(--text-primary);
    }
    .mark-read-btn {
      background: none;
      border: none;
      color: var(--accent);
      font-size: 12px;
      cursor: pointer;
    }
    .notif-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 10px 16px;
      cursor: pointer;
      border-bottom: 1px solid var(--border-subtle);
      transition: background 0.1s;
    }
    .notif-item:hover { background: var(--bg-elevated); }
    .notif-item.unread { background: var(--accent-glow); }
    .notif-msg { font-size: 13px; color: var(--text-primary); }
    .notif-time { font-size: 11px; color: var(--text-tertiary); }
    .notif-empty {
      padding: 20px;
      text-align: center;
      color: var(--text-tertiary);
      font-size: 13px;
    }

    /* User menu */
    .user-menu { position: relative; cursor: pointer; }
    .user-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      z-index: 200;
      min-width: 120px;
    }
    .logout-btn {
      display: block;
      width: 100%;
      padding: 10px 16px;
      background: none;
      border: none;
      color: var(--danger);
      text-align: left;
      font-size: 13px;
      cursor: pointer;
    }
    .logout-btn:hover { background: var(--danger-dim); }
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
