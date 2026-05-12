import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AvatarComponent, BadgeComponent],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed">
      <div class="logo">
        <span class="logo-icon">TS</span>
        <span class="logo-text" *ngIf="!isCollapsed">TeamSync</span>
      </div>

      <nav class="nav">
        <a *ngFor="let item of navItems"
           [routerLink]="item.route"
           routerLinkActive="active"
           class="nav-item"
           [title]="isCollapsed ? item.label : ''">
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label" *ngIf="!isCollapsed">{{ item.label }}</span>
        </a>
      </nav>

      <div class="sidebar-footer" *ngIf="user$ | async as user">
        <app-avatar [user]="user" size="sm"></app-avatar>
        <div class="user-info" *ngIf="!isCollapsed">
          <span class="username">{{ user.username }}</span>
          <app-badge [text]="user.role" variant="muted"></app-badge>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 240px;
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      height: 100vh;
      transition: width 0.2s ease;
      flex-shrink: 0;
    }
    .sidebar.collapsed { width: 64px; }
    .logo {
      display: flex; align-items: center; gap: 10px;
      padding: 20px 16px; border-bottom: 1px solid var(--color-border);
    }
    .logo-icon {
      width: 32px; height: 32px; border-radius: var(--radius-md);
      background: var(--color-accent); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px; flex-shrink: 0;
    }
    .logo-text { font-weight: 700; font-size: 15px; white-space: nowrap; }
    .nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 10px; border-radius: var(--radius-md);
      color: var(--color-muted); text-decoration: none;
      transition: background 0.15s, color 0.15s;
      font-size: 14px; font-weight: 500;
    }
    .nav-item:hover { background: rgba(255,255,255,0.05); color: var(--color-text); }
    .nav-item.active {
      background: rgba(99,102,241,0.12);
      color: var(--color-accent);
      border-left: 3px solid var(--color-accent);
    }
    .nav-icon { font-size: 18px; flex-shrink: 0; }
    .nav-label { white-space: nowrap; }
    .sidebar-footer {
      display: flex; align-items: center; gap: 10px;
      padding: 16px; border-top: 1px solid var(--color-border);
    }
    .user-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .username { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `]
})
export class SidebarComponent {
  readonly authStore = inject(AuthStore);
  readonly user$ = this.authStore.user$;
  isCollapsed = false;

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: '🏠', route: '/dashboard' },
    { label: 'Workspaces', icon: '📁', route: '/workspaces' },
    { label: 'Patterns', icon: '🧩', route: '/patterns' },
  ];
}
