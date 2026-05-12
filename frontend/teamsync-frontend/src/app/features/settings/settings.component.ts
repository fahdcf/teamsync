import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../store/auth.store';
import { User } from '../../shared/models/user.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-page">
      <header class="page-header">
        <h1>Settings</h1>
        <p class="page-sub">Manage your account, notifications, and preferences.</p>
      </header>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab-btn" *ngFor="let tab of tabs"
          [class.active]="activeTab === tab.id"
          (click)="activeTab = tab.id" type="button">
          <span class="tab-icon">{{ tab.icon }}</span>{{ tab.label }}
        </button>
      </div>

      <div class="tab-content">

        <!-- Profile Tab -->
        <div *ngIf="activeTab === 'profile'" class="settings-card">
          <div class="card-header"><h2>Profile</h2><p>Your personal information.</p></div>
          <div class="avatar-section">
            <div class="big-avatar">{{ initials }}</div>
            <div>
              <div class="avatar-name">{{ user?.username || '—' }}</div>
              <div class="avatar-role">{{ roleLabel }}</div>
            </div>
          </div>
          <div class="fields-grid">
            <div class="field-group">
              <label>Username</label>
              <div class="field-value">{{ user?.username || '—' }}</div>
            </div>
            <div class="field-group">
              <label>Email</label>
              <div class="field-value">{{ user?.email || '—' }}</div>
            </div>
            <div class="field-group">
              <label>Role</label>
              <div class="field-value"><span class="role-badge">{{ roleLabel }}</span></div>
            </div>
            <div class="field-group">
              <label>Member Since</label>
              <div class="field-value">{{ user?.createdAt | date:'MMMM d, y' }}</div>
            </div>
          </div>
        </div>

        <!-- Notifications Tab -->
        <div *ngIf="activeTab === 'notifications'" class="settings-card">
          <div class="card-header"><h2>Notifications</h2><p>Control how you receive notifications.</p></div>
          <div class="toggle-list">
            <div class="toggle-row" *ngFor="let n of notifSettings">
              <div class="toggle-info">
                <span class="toggle-label">{{ n.label }}</span>
                <span class="toggle-desc">{{ n.desc }}</span>
              </div>
              <button class="toggle-switch" [class.on]="n.enabled"
                (click)="n.enabled = !n.enabled" type="button"
                [attr.aria-checked]="n.enabled">
                <span class="toggle-knob"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Appearance Tab -->
        <div *ngIf="activeTab === 'appearance'" class="settings-card">
          <div class="card-header"><h2>Appearance</h2><p>Customize the look and feel.</p></div>
          <div class="appearance-grid">
            <div class="theme-option active">
              <div class="theme-preview dark-preview">
                <div class="preview-sidebar"></div>
                <div class="preview-content">
                  <div class="preview-bar"></div>
                  <div class="preview-card"></div>
                </div>
              </div>
              <div class="theme-label"><span class="check-icon">✓</span> Dark (Active)</div>
            </div>
            <div class="theme-option disabled">
              <div class="theme-preview light-preview">
                <div class="preview-sidebar light"></div>
                <div class="preview-content light">
                  <div class="preview-bar light"></div>
                  <div class="preview-card light"></div>
                </div>
              </div>
              <div class="theme-label muted">Light (Coming soon)</div>
            </div>
          </div>
          <div class="accent-section">
            <h3>Accent Color</h3>
            <div class="accent-swatches">
              <div class="swatch active" style="background:#D4A853"></div>
              <div class="swatch" style="background:#60A5FA"></div>
              <div class="swatch" style="background:#4ADE80"></div>
              <div class="swatch" style="background:#F472B6"></div>
              <div class="swatch" style="background:#A78BFA"></div>
            </div>
          </div>
        </div>

        <!-- Security Tab -->
        <div *ngIf="activeTab === 'security'" class="settings-card">
          <div class="card-header"><h2>Security</h2><p>Keep your account safe.</p></div>
          <div class="security-section">
            <h3>Change Password</h3>
            <div class="fields-stack">
              <div class="field-group">
                <label>Current Password</label>
                <input type="password" class="field-input" placeholder="Enter current password" />
              </div>
              <div class="field-group">
                <label>New Password</label>
                <input type="password" class="field-input" placeholder="Enter new password" />
              </div>
              <div class="field-group">
                <label>Confirm New Password</label>
                <input type="password" class="field-input" placeholder="Confirm new password" />
              </div>
            </div>
            <button class="save-btn" type="button">Update Password</button>
          </div>
          <div class="divider"></div>
          <div class="security-section">
            <h3>Sessions</h3>
            <div class="session-row">
              <div>
                <div class="session-device">Current Browser · Windows</div>
                <div class="session-time">Active now</div>
              </div>
              <span class="active-dot"></span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .settings-page { min-height:100%; padding:32px; background:var(--bg-base); color:var(--text-primary); }
    .page-header { margin-bottom:24px; }
    h1 { font-size:24px; font-weight:600; margin-bottom:4px; }
    .page-sub { font-size:13px; color:var(--text-secondary); }
    .tabs { display:flex; gap:4px; border-bottom:1px solid var(--border-subtle); margin-bottom:28px; }
    .tab-btn { height:40px; padding:0 16px; border:none; background:transparent; color:var(--text-secondary); font-size:13px; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:all 0.15s; display:flex; align-items:center; gap:8px; }
    .tab-btn:hover { color:var(--text-primary); }
    .tab-btn.active { color:var(--text-primary); border-bottom-color:var(--accent); }
    .tab-icon { font-size:14px; }
    .settings-card { background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:28px; max-width:680px; display:flex; flex-direction:column; gap:24px; }
    .card-header h2 { font-size:16px; font-weight:600; margin-bottom:4px; }
    .card-header p { font-size:13px; color:var(--text-secondary); }
    .avatar-section { display:flex; align-items:center; gap:18px; padding:16px; background:var(--bg-elevated); border-radius:var(--radius-lg); }
    .big-avatar { width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg,#D4A853,#8b5cf6); color:#fff; font-size:20px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .avatar-name { font-size:16px; font-weight:600; margin-bottom:4px; }
    .avatar-role { font-size:12px; color:var(--text-secondary); }
    .fields-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    .field-group label { display:block; font-size:11px; font-weight:600; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px; }
    .field-value { font-size:13px; color:var(--text-primary); padding:8px 12px; background:var(--bg-elevated); border-radius:var(--radius-md); border:1px solid var(--border-subtle); }
    .role-badge { display:inline-block; padding:2px 10px; border-radius:var(--radius-full); background:var(--accent-dim); color:var(--accent); font-size:12px; font-weight:500; }
    .toggle-list { display:flex; flex-direction:column; gap:4px; }
    .toggle-row { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-radius:var(--radius-md); transition:background 0.12s; }
    .toggle-row:hover { background:var(--bg-elevated); }
    .toggle-info { display:flex; flex-direction:column; gap:3px; }
    .toggle-label { font-size:13px; font-weight:500; color:var(--text-primary); }
    .toggle-desc { font-size:12px; color:var(--text-secondary); }
    .toggle-switch { width:44px; height:24px; border-radius:12px; border:none; background:var(--bg-elevated); cursor:pointer; position:relative; transition:background 0.2s; padding:0; flex-shrink:0; }
    .toggle-switch.on { background:var(--accent); }
    .toggle-knob { position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%; background:#fff; transition:transform 0.2s; }
    .toggle-switch.on .toggle-knob { transform:translateX(20px); }
    .appearance-grid { display:flex; gap:16px; }
    .theme-option { display:flex; flex-direction:column; gap:10px; cursor:pointer; }
    .theme-option.disabled { cursor:not-allowed; opacity:0.5; }
    .theme-preview { width:160px; height:100px; border-radius:var(--radius-lg); border:2px solid transparent; overflow:hidden; display:flex; transition:border-color 0.15s; }
    .theme-option.active .theme-preview { border-color:var(--accent); }
    .dark-preview { background:#0c0c0e; }
    .preview-sidebar { width:36px; background:#141416; border-right:1px solid rgba(255,255,255,0.06); }
    .preview-content { flex:1; padding:6px; display:flex; flex-direction:column; gap:4px; }
    .preview-bar { height:8px; background:#1c1c1f; border-radius:3px; }
    .preview-card { flex:1; background:#141416; border-radius:3px; border:1px solid rgba(255,255,255,0.06); }
    .light-preview { background:#f8f9fa; }
    .preview-sidebar.light { background:#fff; border-right:1px solid #e5e7eb; }
    .preview-content.light .preview-bar.light { background:#e5e7eb; }
    .preview-content.light .preview-card.light { background:#fff; border:1px solid #e5e7eb; }
    .theme-label { font-size:12px; color:var(--text-primary); display:flex; align-items:center; gap:6px; }
    .theme-label.muted { color:var(--text-tertiary); }
    .check-icon { color:var(--accent); font-weight:700; }
    .accent-section { display:flex; flex-direction:column; gap:10px; }
    .accent-section h3 { font-size:13px; font-weight:600; color:var(--text-secondary); }
    .accent-swatches { display:flex; gap:10px; }
    .swatch { width:28px; height:28px; border-radius:50%; cursor:pointer; transition:transform 0.15s; }
    .swatch:hover { transform:scale(1.15); }
    .swatch.active { outline:2px solid var(--text-primary); outline-offset:2px; }
    .security-section { display:flex; flex-direction:column; gap:16px; }
    .security-section h3 { font-size:14px; font-weight:600; }
    .fields-stack { display:flex; flex-direction:column; gap:14px; }
    .field-input { width:100%; height:38px; padding:0 12px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); color:var(--text-primary); font-size:13px; outline:none; transition:border-color 0.15s; }
    .field-input:focus { border-color:var(--border-default); }
    .field-input::placeholder { color:var(--text-tertiary); }
    .save-btn { height:36px; padding:0 20px; background:var(--accent); border:none; border-radius:var(--radius-md); color:#0c0c0e; font-size:13px; font-weight:600; cursor:pointer; align-self:flex-start; transition:background 0.15s; }
    .save-btn:hover { background:var(--accent-hover); }
    .divider { border-top:1px solid var(--border-subtle); }
    .session-row { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--bg-elevated); border-radius:var(--radius-md); }
    .session-device { font-size:13px; font-weight:500; margin-bottom:3px; }
    .session-time { font-size:12px; color:var(--text-secondary); }
    .active-dot { width:8px; height:8px; border-radius:50%; background:var(--success); flex-shrink:0; }
  `]
})
export default class SettingsComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  user: User | null = null;
  activeTab = 'profile';

  readonly tabs = [
    { id:'profile', label:'Profile', icon:'👤' },
    { id:'notifications', label:'Notifications', icon:'🔔' },
    { id:'appearance', label:'Appearance', icon:'🎨' },
    { id:'security', label:'Security', icon:'🔒' },
  ];

  notifSettings = [
    { label:'In-App Notifications', desc:'Receive notifications inside the app.', enabled:true },
    { label:'Email Notifications', desc:'Get updates sent to your email.', enabled:true },
    { label:'Task Assignments', desc:'Notify when a task is assigned to you.', enabled:true },
    { label:'Project Updates', desc:'Notify when a project status changes.', enabled:false },
    { label:'Comment Mentions', desc:'Notify when someone mentions you in comments.', enabled:true },
    { label:'Weekly Digest', desc:'Get a weekly summary of your activity.', enabled:false },
  ];

  ngOnInit(): void {
    this.authStore.user$.subscribe(u => this.user = u);
  }

  get initials(): string {
    return this.user?.username.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase() ?? '??';
  }

  get roleLabel(): string {
    const map: Record<string, string> = { ADMIN:'Administrator', PROJECT_MANAGER:'Project Manager', TEAM_MEMBER:'Team Member' };
    return map[this.user?.role ?? ''] ?? this.user?.role ?? '—';
  }
}
