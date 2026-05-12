import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { SidebarStateService } from '../../core/services/sidebar-state.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

interface NavItem {
  label: string;
  route: string;
  iconPath: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterLink, RouterLinkActive, AvatarComponent],
  template: `
    <div class="overlay-backdrop"
         *ngIf="isOverlay && (sidebarState.mobileOpen$ | async)"
         (click)="sidebarState.close()">
    </div>

    <aside class="sidebar"
           [class.collapsed]="isCollapsed"
           [class.overlay]="isOverlay"
           [class.overlay-open]="isOverlay && (sidebarState.mobileOpen$ | async)">

      <!-- Logo -->
      <div class="logo">
        <span class="logo-icon">◈</span>
        <span class="logo-text" *ngIf="!isCollapsed">TeamSync</span>
        <button class="collapse-btn" *ngIf="!isOverlay" (click)="toggleCollapse()" [title]="isCollapsed ? 'Expand' : 'Collapse'">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path *ngIf="!isCollapsed" d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            <path *ngIf="isCollapsed" d="M5 2l5 5-5 5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- Nav -->
      <nav class="nav">
        <a *ngFor="let item of navItems"
           [routerLink]="item.route"
           routerLinkActive="active"
           class="nav-item"
           [title]="isCollapsed ? item.label : ''"
           (click)="isOverlay && sidebarState.close()">
          <span class="nav-icon" [innerHTML]="item.iconPath"></span>
          <span class="nav-label" *ngIf="!isCollapsed">{{ item.label }}</span>
        </a>

        <div class="nav-separator"></div>
      </nav>

      <!-- Bottom section -->
      <div class="sidebar-bottom">
        <!-- AI Assistant -->
        <div class="ai-item" *ngIf="!isCollapsed">
          <div class="ai-avatar">
            <svg width="28" height="28" viewBox="0 0 28 28">
              <defs>
                <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#8B5CF6"/>
                  <stop offset="100%" style="stop-color:#3B82F6"/>
                </linearGradient>
              </defs>
              <circle cx="14" cy="14" r="14" fill="url(#aiGrad)"/>
              <text x="14" y="18" text-anchor="middle" fill="white" font-size="11" font-weight="600">AI</text>
            </svg>
          </div>
          <div class="ai-info">
            <span class="ai-label">AI Assistant</span>
            <span class="ai-status"><span class="online-dot"></span> Online</span>
          </div>
          <button class="ai-plus">+</button>
        </div>

        <!-- Trial usage -->
        <div class="trial" *ngIf="!isCollapsed">
          <div class="trial-header">
            <span class="trial-label">Trial usage</span>
            <span class="trial-pct">78%</span>
          </div>
          <div class="trial-bar"><div class="trial-fill"></div></div>
          <a class="trial-upgrade" href="#">Upgrade plan →</a>
        </div>

        <!-- User -->
        <div class="user-section" *ngIf="(user$ | async) as user">
          <app-avatar [user]="user" size="sm"></app-avatar>
          <div class="user-info" *ngIf="!isCollapsed">
            <span class="user-name">{{ user.username }}</span>
            <span class="user-role">{{ user.role }}</span>
          </div>
          <svg *ngIf="!isCollapsed" class="chevron" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .overlay-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 198;
    }
    .sidebar {
      width: 200px;
      background: var(--bg-surface);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      height: 100vh;
      transition: width 0.2s ease;
      flex-shrink: 0;
      z-index: 199;
    }
    .sidebar.collapsed { width: 52px; }
    .sidebar.overlay {
      position: fixed; top: 0; left: 0; height: 100vh;
      transform: translateX(-100%);
      transition: transform 0.25s ease;
    }
    .sidebar.overlay.overlay-open { transform: translateX(0); }

    /* Logo */
    .logo {
      height: 52px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 8px;
      flex-shrink: 0;
    }
    .logo-icon {
      font-size: 20px;
      color: var(--text-primary);
      flex-shrink: 0;
      line-height: 1;
    }
    .logo-text {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      flex: 1;
    }
    .collapse-btn {
      background: none;
      border: none;
      color: var(--text-tertiary);
      padding: 4px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: color 0.15s, background 0.15s;
      margin-left: auto;
      flex-shrink: 0;
    }
    .collapse-btn:hover { color: var(--text-secondary); background: var(--bg-elevated); }
    .sidebar.collapsed .logo { justify-content: center; padding: 0; }
    .sidebar.collapsed .collapse-btn { margin-left: 0; }

    /* Nav */
    .nav {
      flex: 1;
      padding: 8px 0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      margin: 2px 8px;
      border-radius: var(--radius-md);
      color: var(--text-tertiary);
      text-decoration: none;
      font-size: 13px;
      font-weight: 400;
      transition: background 0.1s, color 0.1s;
      white-space: nowrap;
    }
    .nav-item:hover { background: rgba(28,28,31,0.6); color: var(--text-secondary); }
    .nav-item.active { background: var(--bg-elevated); color: var(--text-primary); }
    .nav-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav-icon svg { width: 16px; height: 16px; }
    .nav-label { overflow: hidden; text-overflow: ellipsis; }
    .nav-separator {
      height: 1px;
      background: var(--border-subtle);
      margin: 8px 16px;
    }
    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 8px;
      margin: 2px 6px;
    }

    /* Bottom section */
    .sidebar-bottom {
      padding: 8px 0 12px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    /* AI Assistant */
    .ai-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      margin: 2px 8px;
      border-radius: var(--radius-md);
      cursor: pointer;
    }
    .ai-item:hover { background: var(--bg-elevated); }
    .ai-avatar { flex-shrink: 0; }
    .ai-info { flex: 1; min-width: 0; }
    .ai-label { display: block; font-size: 12px; font-weight: 500; color: var(--text-primary); }
    .ai-status { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-tertiary); }
    .online-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--success); flex-shrink: 0; }
    .ai-plus {
      background: none;
      border: none;
      color: var(--text-tertiary);
      font-size: 16px;
      cursor: pointer;
      padding: 2px 4px;
      line-height: 1;
    }

    /* Trial */
    .trial {
      padding: 8px 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .trial-header { display: flex; justify-content: space-between; }
    .trial-label { font-size: 11px; color: var(--text-tertiary); }
    .trial-pct { font-size: 11px; color: var(--text-secondary); }
    .trial-bar {
      height: 4px;
      background: var(--bg-elevated);
      border-radius: 2px;
      overflow: hidden;
    }
    .trial-fill {
      height: 100%;
      width: 78%;
      background: var(--accent);
      border-radius: 2px;
    }
    .trial-upgrade {
      font-size: 11px;
      color: var(--accent);
      text-decoration: none;
    }
    .trial-upgrade:hover { color: var(--accent-hover); }

    /* User section */
    .user-section {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      margin: 2px 8px;
      border-radius: var(--radius-md);
      cursor: pointer;
    }
    .user-section:hover { background: var(--bg-elevated); }
    .user-info { flex: 1; min-width: 0; }
    .user-name {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-role { font-size: 11px; color: var(--text-tertiary); }
    .chevron { color: var(--text-tertiary); flex-shrink: 0; }
    .sidebar.collapsed .user-section { justify-content: center; }
  `]
})
export class SidebarComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly sidebarState = inject(SidebarStateService);
  readonly user$ = this.authStore.user$;

  isCollapsed = false;
  isOverlay = false;

  readonly navItems: NavItem[] = [
    {
      label: 'Dashboard', route: '/dashboard',
      iconPath: '<svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>'
    },
    {
      label: 'Workspaces', route: '/workspaces',
      iconPath: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="3" width="12" height="10" rx="1"/><path d="M5 3V2M11 3V2"/><path d="M2 7h12"/></svg>'
    },
    {
      label: 'Projects', route: '/workspaces',
      iconPath: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M1 4a1 1 0 011-1h4l2 2h6a1 1 0 011 1v7a1 1 0 01-1 1H2a1 1 0 01-1-1V4z"/></svg>'
    },
    {
      label: 'Tasks', route: '/dashboard',
      iconPath: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    },
    {
      label: 'Analytics', route: '/dashboard',
      iconPath: '<svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="10" width="3" height="5"/><rect x="6" y="6" width="3" height="9"/><rect x="11" y="2" width="3" height="13"/></svg>'
    },
    {
      label: 'Notifications', route: '/dashboard',
      iconPath: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M8 2a5 5 0 00-5 5v3l-1 1h12l-1-1V7a5 5 0 00-5-5z"/><path d="M6.5 13a1.5 1.5 0 003 0"/></svg>'
    },
    {
      label: 'Settings', route: '/dashboard',
      iconPath: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4"/></svg>'
    },
  ];

  ngOnInit(): void { this.updateLayout(); }

  @HostListener('window:resize')
  onResize(): void { this.updateLayout(); }

  toggleCollapse(): void { this.isCollapsed = !this.isCollapsed; }

  private updateLayout(): void {
    const w = window.innerWidth;
    if (w >= 1024) {
      this.isOverlay = false;
    } else if (w >= 768) {
      this.isCollapsed = true;
      this.isOverlay = false;
    } else {
      this.isCollapsed = false;
      this.isOverlay = true;
      this.sidebarState.close();
    }
  }
}
