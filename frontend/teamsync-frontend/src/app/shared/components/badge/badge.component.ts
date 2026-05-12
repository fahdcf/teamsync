import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `<span class="badge" [class]="'badge--' + variant">{{ text }}</span>`,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 500;
    }
    .badge--success { background: var(--success-dim); color: var(--success); }
    .badge--warning { background: var(--warning-dim); color: var(--warning); }
    .badge--danger  { background: var(--danger-dim);  color: var(--danger); }
    .badge--info    { background: var(--info-dim);    color: var(--info); }
    .badge--muted   { background: var(--bg-elevated); color: var(--text-secondary); }
    .badge--accent  { background: var(--accent-dim);  color: var(--accent); }
  `]
})
export class BadgeComponent {
  @Input() variant: 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'accent' = 'info';
  @Input() text = '';
}
