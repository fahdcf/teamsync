import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="empty" [class.empty--minimal]="minimal" [class.empty--error]="variant === 'error'">
      <div *ngIf="!minimal" class="empty__icon">{{ resolvedIcon }}</div>
      <p class="empty__title" *ngIf="resolvedTitle">{{ resolvedTitle }}</p>
      <p class="empty__desc" *ngIf="description">{{ description }}</p>
      <app-button *ngIf="resolvedActionLabel && !minimal" variant="primary" size="sm" (click)="action.emit()">
        {{ resolvedActionLabel }}
      </app-button>
    </div>
  `,
  styles: [`
    .empty {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 8px; padding: 40px 20px; text-align: center;
    }
    .empty--minimal { padding: 16px; }
    .empty--error .empty__title { color: var(--color-danger); }
    .empty__icon { font-size: 32px; }
    .empty__title { font-size: 15px; font-weight: 600; margin: 0; }
    .empty__desc { font-size: 13px; color: var(--color-muted); margin: 0; }
  `]
})
export class EmptyStateComponent {
  @Input() variant: 'default' | 'error' = 'default';
  @Input() icon = '';
  @Input() title = '';
  @Input() description = '';
  @Input() actionLabel = '';
  @Input() minimal = false;
  @Output() action = new EventEmitter<void>();

  get resolvedIcon(): string {
    if (this.icon) return this.icon;
    return this.variant === 'error' ? '❌' : '📭';
  }

  get resolvedTitle(): string {
    if (this.title) return this.title;
    return this.variant === 'error' ? 'Something went wrong' : '';
  }

  get resolvedActionLabel(): string {
    if (this.actionLabel) return this.actionLabel;
    return this.variant === 'error' ? 'Retry' : '';
  }
}
