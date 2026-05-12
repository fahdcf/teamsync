import { Component, HostListener, OnInit, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { SidebarStateService } from '../../core/services/sidebar-state.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

interface NavItem {
  label: string;
  route: string;
  iconPath: string;
  count?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterLink, RouterLinkActive, AvatarComponent],
  template: `
    <div
      class="overlay-backdrop"
      *ngIf="isOverlay && (sidebarState.mobileOpen$ | async)"
      (click)="sidebarState.close()"
    ></div>

    <aside
      class="sidebar"
      [class.collapsed]="isCollapsed"
      [class.overlay]="isOverlay"
      [class.overlay-open]="isOverlay && (sidebarState.mobileOpen$ | async)"
    >
      <div class="logo">
        <div class="logo-brand">
          <svg class="logo-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 1.2 14.2 4.8 8 8.4 1.8 4.8 8 1.2Z"></path>
            <path d="M8 9.1 14.2 5.5v5L8 14.2 1.8 10.5v-5L8 9.1Z" opacity="0.85"></path>
          </svg>
          <span class="logo-text" *ngIf="!isCollapsed">TeamSync</span>
        </div>
        <button
          *ngIf="!isOverlay"
          class="collapse-btn"
          type="button"
          [attr.aria-label]="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          [title]="isCollapsed ? 'Expand' : 'Collapse'"
          (click)="toggleCollapse()"
        >
          <span aria-hidden="true">{{ isCollapsed ? '>>' : '<<' }}</span>
        </button>
      </div>

      <nav class="nav">
        <a
          *ngFor="let item of navItems"
          class="nav-item"
          [routerLink]="item.route"
          routerLinkActive="active"
          [title]="isCollapsed ? item.label : ''"
          (click)="isOverlay && sidebarState.close()"
        >
          <span class="nav-icon" [innerHTML]="item.iconPath"></span>
          <span class="nav-label" *ngIf="!isCollapsed">{{ item.label }}</span>
          <span class="nav-count" *ngIf="!isCollapsed && item.count">{{ item.count }}</span>
        </a>
      </nav>

      <div class="separator"></div>

      <div class="sidebar-bottom" *ngIf="(user$ | async) as user">
        <button class="ai-item" type="button" [title]="isCollapsed ? 'AI Assistant' : ''">
          <span class="ai-avatar">AI</span>
          <span class="ai-content" *ngIf="!isCollapsed">
            <span class="ai-title">AI Assistant</span>
            <span class="ai-status"><span class="online-dot"></span> Online</span>
          </span>
          <span class="ai-plus" *ngIf="!isCollapsed">+</span>
        </button>

        <div class="trial" *ngIf="!isCollapsed">
          <div class="trial-row">
            <span class="trial-label">Trial usage</span>
            <span class="trial-percent">78%</span>
          </div>
          <div class="trial-bar"><span class="trial-fill"></span></div>
          <a class="trial-link" href="#">Upgrade plan -></a>
        </div>

        <button class="user-item" type="button" [title]="isCollapsed ? user.username : ''">
          <app-avatar [user]="user" size="sm"></app-avatar>
          <span class="user-copy" *ngIf="!isCollapsed">
            <span class="user-name">{{ user.username }}</span>
            <span class="user-role">{{ user.role }}</span>
          </span>
          <span class="user-chevron" *ngIf="!isCollapsed">v</span>
        </button>
      </div>
    </aside>
  `,
  styles: [
    `
      .overlay-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        z-index: 198;
      }

      .sidebar {
        width: 200px;
        height: 100vh;
        padding-top: 20px;
        background: var(--bg-surface);
        border-right: 1px solid var(--border-subtle);
        display: flex;
        flex-direction: column;
        transition: width 0.2s ease;
        flex-shrink: 0;
        z-index: 199;
      }

      .sidebar.collapsed {
        width: 52px;
      }

      .sidebar.overlay {
        position: fixed;
        top: 0;
        left: 0;
        transform: translateX(-100%);
        transition: transform 0.25s ease;
      }

      .sidebar.overlay.overlay-open {
        transform: translateX(0);
      }

      .logo {
        height: 52px;
        padding: 0 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .logo-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .logo-icon {
        width: 18px;
        height: 18px;
        color: var(--text-primary);
        flex-shrink: 0;
      }

      .logo-text {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
      }

      .collapse-btn {
        width: 20px;
        height: 20px;
        border: none;
        border-radius: 4px;
        color: var(--text-tertiary);
        background: transparent;
        cursor: pointer;
        font-size: 11px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .collapse-btn:hover {
        color: var(--text-secondary);
        background: var(--bg-elevated);
      }

      .nav {
        padding: 10px 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        margin: 0 8px;
        border-radius: var(--radius-md);
        text-decoration: none;
        color: var(--text-tertiary);
        font-size: 13px;
        font-weight: 400;
        line-height: 1;
      }

      .nav-item:hover {
        background: rgba(28, 28, 31, 0.6);
        color: var(--text-secondary);
      }

      .nav-item.active {
        background: var(--bg-elevated);
        color: var(--text-primary);
      }

      .nav-icon {
        width: 16px;
        height: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .nav-icon :is(svg) {
        width: 16px;
        height: 16px;
      }

      .nav-label {
        flex: 1;
      }

      .nav-count {
        min-width: 18px;
        height: 18px;
        border-radius: 9999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(245, 158, 11, 0.15);
        color: var(--warning);
        font-size: 11px;
      }

      .separator {
        margin: 8px 16px 0;
        border-top: 1px solid var(--border-subtle);
      }

      .sidebar-bottom {
        margin-top: auto;
        padding: 10px 0 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .ai-item,
      .user-item {
        margin: 0 8px;
        border: 0;
        border-radius: var(--radius-md);
        background: transparent;
        color: inherit;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        text-align: left;
        cursor: pointer;
      }

      .ai-item:hover,
      .user-item:hover {
        background: var(--bg-elevated);
      }

      .ai-avatar {
        width: 28px;
        height: 28px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 600;
        color: #f9fafb;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #8b5cf6, #3b82f6);
        flex-shrink: 0;
      }

      .ai-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
      }

      .ai-title {
        font-size: 12px;
        color: var(--text-primary);
      }

      .ai-status {
        font-size: 11px;
        color: var(--text-secondary);
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .online-dot {
        width: 6px;
        height: 6px;
        border-radius: 9999px;
        background: var(--success);
      }

      .ai-plus {
        color: var(--text-secondary);
        font-size: 16px;
      }

      .trial {
        margin: 0 20px;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .trial-row {
        display: flex;
        justify-content: space-between;
      }

      .trial-label,
      .trial-percent {
        font-size: 11px;
        color: var(--text-secondary);
      }

      .trial-bar {
        height: 4px;
        border-radius: 9999px;
        background: var(--bg-elevated);
        overflow: hidden;
      }

      .trial-fill {
        display: block;
        width: 78%;
        height: 100%;
        border-radius: inherit;
        background: var(--accent);
      }

      .trial-link {
        color: var(--accent);
        font-size: 11px;
        text-decoration: none;
      }

      .trial-link:hover {
        color: var(--accent-hover);
      }

      .user-copy {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
      }

      .user-name {
        font-size: 13px;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .user-role {
        font-size: 11px;
        color: var(--text-secondary);
      }

      .user-chevron {
        color: var(--text-tertiary);
        font-size: 12px;
      }

      .collapsed .logo {
        padding: 0 6px;
        justify-content: space-between;
      }

      .collapsed .logo-brand {
        width: 18px;
        justify-content: flex-start;
      }

      .collapsed .logo-text,
      .collapsed .trial,
      .collapsed .ai-content,
      .collapsed .ai-plus,
      .collapsed .user-copy,
      .collapsed .user-chevron {
        display: none;
      }

      .collapsed .nav-item,
      .collapsed .ai-item,
      .collapsed .user-item {
        margin: 0 6px;
        padding: 8px;
        justify-content: center;
      }

      .collapsed .separator {
        margin: 8px 10px 0;
      }
    `,
  ],
})
export class SidebarComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly sidebarState = inject(SidebarStateService);
  readonly user$ = this.authStore.user$;

  isCollapsed = false;
  isOverlay = false;

  readonly navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      iconPath:
        '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"></rect><rect x="9" y="1" width="6" height="6" rx="1"></rect><rect x="1" y="9" width="6" height="6" rx="1"></rect><rect x="9" y="9" width="6" height="6" rx="1"></rect></svg>',
    },
    {
      label: 'Workspaces',
      route: '/workspaces',
      iconPath:
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 6.2 8 2l6 4.2V14H2V6.2Z"></path><path d="M5.2 8.6h5.6"></path></svg>',
    },
    {
      label: 'Projects',
      route: '/workspaces',
      iconPath:
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1.5 4.5A1.5 1.5 0 0 1 3 3h3l1.4 1.8H13a1.5 1.5 0 0 1 1.5 1.5v6.2A1.5 1.5 0 0 1 13 14H3a1.5 1.5 0 0 1-1.5-1.5z"></path></svg>',
    },
    {
      label: 'Tasks',
      route: '/dashboard',
      iconPath:
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="2" width="12" height="12" rx="2"></rect><path d="m5 8 2 2 4-4" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    },
    {
      label: 'Analytics',
      route: '/dashboard',
      iconPath:
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 13.5h12"></path><path d="M4 12V8"></path><path d="M8 12V5"></path><path d="M12 12V3"></path></svg>',
    },
    {
      label: 'Notifications',
      route: '/dashboard',
      iconPath:
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 2.2a4.4 4.4 0 0 0-4.4 4.4v2.8L2.5 11h11L12.4 9.4V6.6A4.4 4.4 0 0 0 8 2.2Z"></path><path d="M6.3 12.6a1.7 1.7 0 0 0 3.4 0"></path></svg>',
      count: 3,
    },
    {
      label: 'Settings',
      route: '/dashboard',
      iconPath:
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="2.1"></circle><path d="M8 1.5v1.7M8 12.8v1.7M1.5 8h1.7M12.8 8h1.7M3.1 3.1l1.2 1.2M11.7 11.7l1.2 1.2M3.1 12.9l1.2-1.2M11.7 4.3l1.2-1.2"></path></svg>',
    },
  ];

  ngOnInit(): void {
    this.updateLayout();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateLayout();
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  private updateLayout(): void {
    const width = window.innerWidth;
    if (width >= 1024) {
      this.isOverlay = false;
      return;
    }

    if (width >= 768) {
      this.isOverlay = false;
      this.isCollapsed = true;
      return;
    }

    this.isOverlay = true;
    this.isCollapsed = false;
    this.sidebarState.close();
  }
}
