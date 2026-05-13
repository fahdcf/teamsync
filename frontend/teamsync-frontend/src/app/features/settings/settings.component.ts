import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../store/auth.store';
import { AccountOverview, AuthService } from '../../api/auth.service';
import { WorkspaceService } from '../../api/workspace.service';
import { User, UserRole } from '../../shared/models/user.model';
import { Workspace } from '../../shared/models/workspace.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <section class="settings-hero">
        <div class="hero-glow" aria-hidden="true"></div>
        <h1>Settings</h1>
        <p>Manage your profile, preferences, notifications, and security.</p>
      </section>

      <nav class="settings-tabs" aria-label="Settings sections">
        <button
          *ngFor="let tab of tabs"
          class="settings-tab"
          [class.active]="activeTab === tab.id"
          (click)="activeTab = tab.id"
          type="button">
          <span class="tab-mark" [attr.data-icon]="tab.icon"></span>
          {{ tab.label }}
        </button>
      </nav>

      <div class="settings-layout" *ngIf="activeTab === 'profile'">
        <section class="profile-panel">
          <div class="profile-left">
            <div class="profile-orb">
              <img *ngIf="profileForm.avatarUrl" [src]="profileForm.avatarUrl" alt="Profile avatar">
              <span *ngIf="!profileForm.avatarUrl">{{ initials }}</span>
              <button type="button" (click)="startEditing('avatar')" aria-label="Edit avatar">/</button>
            </div>
            <div class="avatar-editor" *ngIf="editingField === 'avatar'">
              <input [(ngModel)]="profileForm.avatarUrl" placeholder="Avatar image URL">
              <div>
                <button type="button" (click)="saveProfile()">Save</button>
                <button type="button" (click)="cancelEditing()">Cancel</button>
              </div>
            </div>

            <div class="completion-block">
              <div class="completion-top">
                <span>Profile Completion</span>
                <strong>{{ profileCompletion }}%</strong>
              </div>
              <div class="completion-track"><i [style.width.%]="profileCompletion"></i></div>
              <p>{{ completionMessage }}</p>
            </div>
          </div>

          <div class="profile-fields">
            <label class="profile-field">
              <span>Username</span>
              <div class="field-shell">
                <input [readonly]="editingField !== 'username'" [(ngModel)]="profileForm.username" />
                <button type="button" (click)="editingField === 'username' ? saveProfile() : startEditing('username')" [attr.aria-label]="editingField === 'username' ? 'Save username' : 'Edit username'">{{ editingField === 'username' ? 'Save' : '/' }}</button>
                <button *ngIf="editingField === 'username'" type="button" (click)="cancelEditing()">Cancel</button>
              </div>
            </label>

            <label class="profile-field">
              <span>Email</span>
              <div class="field-shell">
                <input [readonly]="editingField !== 'email'" [(ngModel)]="profileForm.email" />
                <button type="button" (click)="editingField === 'email' ? saveProfile() : startEditing('email')" [attr.aria-label]="editingField === 'email' ? 'Save email' : 'Edit email'">{{ editingField === 'email' ? 'Save' : '/' }}</button>
                <button *ngIf="editingField === 'email'" type="button" (click)="cancelEditing()">Cancel</button>
              </div>
            </label>

            <label class="profile-field">
              <span>Role</span>
              <div class="field-shell select-shell">
                <input *ngIf="editingField !== 'role'" readonly [value]="roleLabel" />
                <select *ngIf="editingField === 'role'" [(ngModel)]="profileForm.role">
                  <option *ngFor="let role of roleOptions" [value]="role">{{ roleLabelFor(role) }}</option>
                </select>
                <button type="button" (click)="editingField === 'role' ? saveProfile() : startEditing('role')" [attr.aria-label]="editingField === 'role' ? 'Save role' : 'Edit role'">{{ editingField === 'role' ? 'Save' : '/' }}</button>
                <button *ngIf="editingField === 'role'" type="button" (click)="cancelEditing()">Cancel</button>
              </div>
            </label>

            <label class="profile-field member-since">
              <span>Member Since</span>
              <div class="field-shell full-field">
                <input readonly [value]="memberSince" />
              </div>
            </label>

            <div class="profile-hint">
              <span class="hint-icon">o</span>
              <p>{{ profileMessage || 'This is how your teammates see you across TeamSync.' }}<br />Keep your profile up to date.</p>
            </div>
          </div>
        </section>

        <aside class="settings-side">
          <article class="side-card account-card">
            <header><span class="side-icon trend"></span><h2>Account Overview</h2></header>
            <div class="overview-row">
              <span class="soft-icon box"></span>
              <div>
                <div class="row-head"><span>Profile Completion</span><strong>{{ profileCompletion }}%</strong></div>
                <div class="mini-progress"><i [style.width.%]="profileCompletion"></i></div>
              </div>
            </div>
            <div class="overview-row">
              <span class="soft-icon shield"></span>
              <div class="row-head"><span>Security Status</span><strong class="secure" [class.warn]="!isSecuritySecure"><i></i>{{ securityStatus }}</strong></div>
            </div>
            <p class="security-note">{{ securityMessage }}</p>
          </article>

          <article class="side-card membership-card">
            <header><span class="side-icon users"></span><h2>Workspace Membership</h2></header>
            <div class="workspace-row" *ngFor="let workspace of visibleWorkspaces">
              <div class="workspace-avatar">{{ firstLetter(workspace.name) }}</div>
              <div><strong>{{ workspace.name }}</strong><span>Workspace</span></div>
              <em>Owner</em>
            </div>
            <div class="workspace-row empty" *ngIf="!visibleWorkspaces.length">
              <div class="workspace-avatar">W</div>
              <div><strong>No workspace</strong><span>Join or create a workspace</span></div>
            </div>
          </article>

          <article class="side-card recent-card">
            <header><span class="side-icon clock"></span><h2>Recent Activity</h2></header>
            <div class="recent-row" *ngFor="let item of recentActivity">
              <span class="recent-dot"></span>
              <p>{{ item.label }}</p>
              <time>{{ item.time }}</time>
            </div>
            <a href="#">View all activity -></a>
          </article>
        </aside>
      </div>

      <section class="settings-placeholder" *ngIf="activeTab !== 'profile'">
        <h2>{{ activeLabel }}</h2>
        <p>This section is ready for the next settings pass.</p>
      </section>
    </div>
  `,
  styles: [`
    .settings-page {
      min-height: 100%;
      padding: 42px 48px 48px;
      color: var(--text-primary);
      background:
        radial-gradient(ellipse 38% 28% at 33% 5%, rgba(212,168,83,0.18), transparent 70%),
        var(--bg-base);
      overflow: hidden;
      position: relative;
    }

    .settings-hero {
      position: relative;
      margin-bottom: 34px;
      max-width: 900px;
    }

    .hero-glow {
      position: absolute;
      top: -160px;
      left: 250px;
      width: 500px;
      height: 300px;
      pointer-events: none;
      background:
        radial-gradient(ellipse 45% 18% at 50% 68%, rgba(242,182,92,0.45), transparent 70%),
        repeating-radial-gradient(ellipse at 50% 76%, transparent 0 30px, rgba(212,168,83,0.18) 31px 32px, transparent 33px 64px);
      transform: rotate(-7deg);
      opacity: 0.75;
    }

    .settings-hero h1 {
      position: relative;
      margin: 0 0 10px;
      font-size: clamp(36px, 4vw, 48px);
      line-height: 1;
      letter-spacing: -0.05em;
      font-weight: 750;
    }

    .settings-hero p {
      position: relative;
      margin: 0;
      color: var(--text-secondary);
      font-size: 16px;
    }

    .settings-tabs {
      width: min(640px, 100%);
      height: 58px;
      margin-bottom: 28px;
      padding: 4px;
      border: 1px solid var(--border-default);
      border-radius: var(--radius-xl);
      background: linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012)), var(--bg-surface);
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
    }

    .settings-tab {
      border: 0;
      border-radius: var(--radius-lg);
      background: transparent;
      color: var(--text-secondary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-size: 14px;
    }

    .settings-tab.active {
      color: var(--text-primary);
      background: linear-gradient(180deg, rgba(212,168,83,0.13), rgba(255,255,255,0.025));
      border: 1px solid rgba(212,168,83,0.18);
      box-shadow: 0 16px 28px rgba(212,168,83,0.16), inset 0 -2px 0 var(--accent);
    }

    .tab-mark {
      width: 18px;
      height: 18px;
      color: var(--accent);
      position: relative;
    }

    .tab-mark::before {
      content: attr(data-icon);
      font-size: 16px;
    }

    .settings-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 490px;
      gap: 22px;
      align-items: start;
    }

    .profile-panel,
    .side-card,
    .settings-placeholder {
      border: 1px solid var(--border-default);
      border-radius: var(--radius-xl);
      background: linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012)), var(--bg-surface);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), 0 18px 50px rgba(0,0,0,0.22);
    }

    .profile-panel {
      min-height: 575px;
      display: grid;
      grid-template-columns: 300px minmax(0, 1fr);
      overflow: hidden;
    }

    .profile-left {
      padding: 84px 28px 34px;
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      background: radial-gradient(ellipse 78% 22% at 50% 45%, rgba(212,168,83,0.18), transparent 68%);
    }

    .profile-orb {
      width: 172px;
      height: 172px;
      border-radius: var(--radius-full);
      position: relative;
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at 22% 18%, rgba(255,218,164,0.85), transparent 25%),
        linear-gradient(135deg, #e7ad7b, #b65ee0 65%, #7d4cff);
      box-shadow: 0 28px 60px rgba(212,168,83,0.24), inset 0 1px 0 rgba(255,255,255,0.2);
    }

    .profile-orb span {
      font-size: 48px;
      font-weight: 800;
      color: #fff;
    }

    .profile-orb img {
      width: 100%;
      height: 100%;
      border-radius: inherit;
      object-fit: cover;
    }

    .profile-orb button {
      position: absolute;
      right: 6px;
      bottom: 0;
      width: 42px;
      height: 42px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(212,168,83,0.35);
      background: var(--bg-elevated);
      color: var(--accent);
      font-weight: 700;
    }

    .avatar-editor {
      width: 100%;
      display: grid;
      gap: 10px;
      margin-top: 18px;
    }

    .avatar-editor input,
    .field-shell select {
      min-width: 0;
      height: 40px;
      padding: 0 16px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: rgba(255,255,255,0.025);
      color: var(--text-primary);
      outline: none;
    }

    .avatar-editor div {
      display: flex;
      gap: 8px;
    }

    .avatar-editor button {
      height: 34px;
      padding: 0 12px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      color: var(--text-primary);
    }

    .completion-block {
      width: 100%;
    }

    .completion-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .completion-top strong {
      color: var(--text-primary);
      font-weight: 500;
    }

    .completion-track,
    .mini-progress {
      height: 5px;
      margin-top: 10px;
      border-radius: var(--radius-full);
      background: var(--bg-elevated);
      overflow: hidden;
    }

    .completion-track i,
    .mini-progress i {
      display: block;
      width: 70%;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, var(--accent), #ffbd66);
    }

    .completion-block p {
      margin-top: 20px;
      color: var(--text-tertiary);
      font-size: 13px;
      line-height: 1.45;
    }

    .profile-fields {
      padding: 38px 28px 40px;
      display: grid;
      gap: 24px;
    }

    .profile-field > span {
      display: block;
      margin-bottom: 9px;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .field-shell {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      gap: 10px;
    }

    .field-shell input {
      min-width: 0;
      height: 40px;
      padding: 0 16px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: rgba(255,255,255,0.025);
      color: var(--text-primary);
      font-size: 14px;
      outline: none;
    }

    .field-shell button {
      min-width: 44px;
      height: 40px;
      padding: 0 12px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: rgba(255,255,255,0.025);
      color: var(--text-secondary);
    }

    .full-field {
      grid-template-columns: 1fr;
    }

    .profile-hint {
      margin-top: 4px;
      padding-top: 24px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      color: var(--text-secondary);
      font-size: 13px;
      line-height: 1.5;
    }

    .hint-icon {
      width: 60px;
      height: 60px;
      border-radius: var(--radius-lg);
      display: grid;
      place-items: center;
      background: rgba(212,168,83,0.08);
      border: 1px solid var(--border-subtle);
      color: var(--accent);
      font-size: 24px;
    }

    .settings-side {
      display: grid;
      gap: 16px;
    }

    .side-card {
      padding: 26px 24px;
    }

    .side-card header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 22px;
    }

    .side-card h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 650;
    }

    .side-icon,
    .soft-icon {
      color: var(--accent);
      display: inline-grid;
      place-items: center;
    }

    .side-icon::before { content: '~'; }
    .side-icon.users::before { content: 'oo'; }
    .side-icon.clock::before { content: 'o'; }

    .overview-row {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr);
      align-items: center;
      gap: 12px;
      margin-top: 14px;
    }

    .soft-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: rgba(212,168,83,0.08);
      border: 1px solid var(--border-subtle);
    }

    .soft-icon::before { content: '?'; }
    .soft-icon.shield::before { content: '?'; }

    .row-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .row-head strong {
      color: var(--text-primary);
      font-weight: 500;
    }

    .row-head .secure {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--text-secondary);
    }

    .secure i {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--success);
    }

    .secure.warn i {
      background: var(--warning);
    }

    .security-note {
      margin: 14px 0 0 52px;
      color: var(--text-tertiary);
      font-size: 13px;
      line-height: 1.45;
    }

    .workspace-row {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
    }

    .workspace-avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #efbd75, #b65ee0 65%, #7058ff);
      color: #fff;
      font-weight: 800;
    }

    .workspace-row strong,
    .workspace-row span {
      display: block;
    }

    .workspace-row strong {
      font-size: 14px;
    }

    .workspace-row span {
      margin-top: 2px;
      color: var(--text-secondary);
      font-size: 12px;
    }

    .workspace-row em {
      padding: 6px 12px;
      border: 1px solid rgba(212,168,83,0.25);
      border-radius: var(--radius-md);
      color: var(--accent);
      font-size: 12px;
      font-style: normal;
    }

    .recent-row {
      display: grid;
      grid-template-columns: 24px minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
      margin-top: 20px;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .recent-dot {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
    }

    .recent-row p {
      margin: 0;
    }

    .recent-row time {
      color: var(--text-tertiary);
      font-size: 13px;
    }

    .recent-card a {
      display: inline-flex;
      margin-top: 24px;
      color: var(--accent);
      font-size: 14px;
    }

    .settings-placeholder {
      max-width: 640px;
      padding: 36px;
    }

    .settings-placeholder h2 {
      margin: 0 0 8px;
      font-size: 24px;
    }

    .settings-placeholder p {
      color: var(--text-secondary);
    }

    @media (max-width: 1180px) {
      .settings-layout {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 760px) {
      .settings-page {
        padding: 28px 18px;
      }

      .settings-tabs,
      .profile-panel {
        grid-template-columns: 1fr;
        height: auto;
      }

      .settings-tabs {
        display: grid;
      }

      .settings-tab {
        min-height: 46px;
      }

      .profile-left {
        border-right: 0;
        border-bottom: 1px solid var(--border-subtle);
      }
    }
  `]
})
export default class SettingsComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly workspaceService = inject(WorkspaceService);

  user: User | null = null;
  accountOverview: AccountOverview | null = null;
  workspaces: Workspace[] = [];
  activeTab = 'profile';
  editingField: 'username' | 'email' | 'role' | 'avatar' | null = null;
  profileMessage = '';
  profileForm: { username: string; email: string; role: UserRole; avatarUrl: string } = {
    username: '',
    email: '',
    role: 'TEAM_MEMBER',
    avatarUrl: '',
  };

  readonly tabs = [
    { id: 'profile', label: 'Profile', icon: 'o' },
    { id: 'notifications', label: 'Notifications', icon: '^' },
    { id: 'appearance', label: 'Appearance', icon: '*' },
    { id: 'security', label: 'Security', icon: '#' },
  ];
  readonly roleOptions: UserRole[] = ['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'];

  readonly recentActivity = [
    { label: 'Profile updated', time: 'Just now' },
    { label: 'Logged in from Chrome on macOS', time: '2h ago' },
    { label: 'Password changed', time: '3d ago' },
  ];

  ngOnInit(): void {
    this.authStore.user$.subscribe((u) => {
      this.user = u;
      this.resetProfileForm();
    });
    this.workspaceService.getAll().subscribe({
      next: (workspaces) => (this.workspaces = workspaces),
      error: () => (this.workspaces = []),
    });
    this.loadAccountOverview();
  }

  get initials(): string {
    return this.user?.username.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() ?? '??';
  }

  get roleLabel(): string {
    return this.roleLabelFor(this.user?.role);
  }

  get memberSince(): string {
    if (!this.user?.createdAt) return '-';
    return new Date(this.user.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  }

  get visibleWorkspaces(): Workspace[] {
    return this.workspaces.slice(0, 1);
  }

  get profileCompletion(): number {
    return this.accountOverview?.profileCompletion ?? 0;
  }

  get completionMessage(): string {
    const missing = this.accountOverview?.missingProfileFields ?? [];
    if (!missing.length) return 'Your profile is complete and ready for collaboration.';
    return `Complete ${missing.join(', ')} to get the most out of TeamSync.`;
  }

  get securityStatus(): string {
    return this.accountOverview?.securityStatus ?? 'Unknown';
  }

  get securityMessage(): string {
    return this.accountOverview?.securityMessage ?? 'Security details will appear after your account overview loads.';
  }

  get isSecuritySecure(): boolean {
    return this.securityStatus.toLowerCase() === 'secure';
  }

  get activeLabel(): string {
    return this.tabs.find((tab) => tab.id === this.activeTab)?.label ?? 'Settings';
  }

  firstLetter(value: string): string {
    return (value || 'W').charAt(0).toUpperCase();
  }

  roleLabelFor(role?: string): string {
    const map: Record<string, string> = { ADMIN: 'Administrator', PROJECT_MANAGER: 'Project Manager', TEAM_MEMBER: 'Team Member' };
    return map[role ?? ''] ?? role ?? '-';
  }

  startEditing(field: 'username' | 'email' | 'role' | 'avatar'): void {
    this.editingField = field;
    this.profileMessage = field === 'role' ? 'Role changes can only move to the same or lower privilege.' : '';
  }

  cancelEditing(): void {
    this.editingField = null;
    this.profileMessage = '';
    this.resetProfileForm();
  }

  saveProfile(): void {
    this.authService.updateMe({
      username: this.profileForm.username,
      email: this.profileForm.email,
      role: this.profileForm.role,
      avatarUrl: this.profileForm.avatarUrl || null,
    }).subscribe({
      next: (user) => {
        this.authStore.setUser(user);
        this.user = user;
        this.editingField = null;
        this.profileMessage = 'Profile updated successfully.';
        this.loadAccountOverview();
      },
      error: () => {
        this.profileMessage = 'Could not update profile. Check the value and try again.';
      },
    });
  }

  private resetProfileForm(): void {
    if (!this.user) return;
    this.profileForm = {
      username: this.user.username || '',
      email: this.user.email || '',
      role: this.user.role,
      avatarUrl: this.user.avatarUrl || '',
    };
  }

  private loadAccountOverview(): void {
    this.authService.getAccountOverview().subscribe({
      next: (overview) => (this.accountOverview = overview),
      error: () => {
        this.accountOverview = {
          profileCompletion: 0,
          securityStatus: 'Unknown',
          securityMessage: 'Could not load account overview.',
          missingProfileFields: [],
        };
      },
    });
  }
}
