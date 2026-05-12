import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Workspace } from '../../../shared/models/workspace.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-workspace-card',
  standalone: true,
  imports: [CommonModule, AvatarComponent, BadgeComponent, TruncatePipe],
  template: `
    <div class="ws-card">
      <div class="ws-header">
        <h3 class="ws-name">{{ workspace.name }}</h3>
        <app-badge [text]="workspace.members.length + ' members'" variant="info"></app-badge>
      </div>
      <p class="ws-desc">{{ workspace.description | truncate:80 }}</p>
      <div class="ws-footer">
        <app-avatar [user]="workspace.owner" size="sm"></app-avatar>
        <span class="owner-name">{{ workspace.owner.username }}</span>
      </div>
    </div>
  `,
  styles: [`
    .ws-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 20px; cursor: pointer; min-width: 220px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .ws-card:hover { border-color: var(--color-accent); box-shadow: var(--shadow-md); }
    .ws-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; gap: 8px; }
    .ws-name { margin: 0; font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ws-desc { color: var(--color-muted); font-size: 13px; margin: 0 0 16px; }
    .ws-footer { display: flex; align-items: center; gap: 8px; }
    .owner-name { font-size: 12px; color: var(--color-muted); }
  `]
})
export class WorkspaceCardComponent {
  @Input() workspace!: Workspace;
}
