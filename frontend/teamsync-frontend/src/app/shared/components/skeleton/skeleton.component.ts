import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `<div class="skeleton" [class]="'skeleton--' + type"></div>`,
  styles: [`
    .skeleton {
      background: linear-gradient(
        90deg,
        var(--color-border) 25%,
        rgba(255,255,255,0.06) 50%,
        var(--color-border) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius-md);
    }
    @keyframes shimmer {
      0%   { background-position:  200% 0; }
      100% { background-position: -200% 0; }
    }
    .skeleton--card      { height: 140px; width: 100%; }
    .skeleton--list-item { height: 48px;  width: 100%; }
    .skeleton--text      { height: 16px;  width: 100%; border-radius: 4px; }
    .skeleton--avatar    { width: 36px; height: 36px; border-radius: 50%; }
  `]
})
export class SkeletonComponent {
  @Input() type: 'card' | 'list-item' | 'text' | 'avatar' = 'card';
}
