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
      padding: 2px 10px;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge--success { background: rgba(34,197,94,0.15); color: var(--color-success); }
    .badge--warning { background: rgba(245,158,11,0.15); color: var(--color-warning); }
    .badge--danger  { background: rgba(239,68,68,0.15); color: var(--color-danger); }
    .badge--info    { background: rgba(99,102,241,0.15); color: var(--color-accent); }
    .badge--accent  { background: rgba(99,102,241,0.2); color: var(--color-accent); }
    .badge--muted   { background: rgba(100,116,139,0.15); color: var(--color-muted); }
  `]
})
export class BadgeComponent {
  @Input() variant: 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'accent' = 'info';
  @Input() text = '';
}
