import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-card">
      <div class="stats-icon" [class]="'stats-icon--' + color">{{ icon }}</div>
      <div class="stats-body">
        <div class="stats-value">{{ value }}</div>
        <div class="stats-label">{{ label }}</div>
      </div>
    </div>
  `,
  styles: [`
    .stats-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex; align-items: center; gap: 16px;
    }
    .stats-icon {
      width: 48px; height: 48px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center; font-size: 22px;
    }
    .stats-icon--accent  { background: rgba(99,102,241,0.15); }
    .stats-icon--success { background: rgba(34,197,94,0.15); }
    .stats-icon--warning { background: rgba(245,158,11,0.15); }
    .stats-icon--danger  { background: rgba(239,68,68,0.15); }
    .stats-value { font-size: 28px; font-weight: 700; line-height: 1; }
    .stats-label { font-size: 13px; color: var(--color-muted); margin-top: 4px; }
  `]
})
export class StatsCardComponent {
  @Input() icon = '';
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() color: 'accent' | 'success' | 'warning' | 'danger' = 'accent';
}
