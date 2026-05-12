import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SpinnerComponent],
  template: `
    <button [class]="'btn btn--' + variant + ' btn--' + size"
            [disabled]="disabled || loading"
            [type]="type">
      <app-spinner *ngIf="loading" size="sm"></app-spinner>
      <ng-content *ngIf="!loading"></ng-content>
    </button>
  `,
  styles: [`
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: none;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 500;
      transition: background 0.15s, box-shadow 0.15s, border-color 0.15s, transform 0.1s;
      white-space: nowrap;
      cursor: pointer;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn--sm  { height: 32px; padding: 0 14px; font-size: 13px; }
    .btn--md  { height: 36px; padding: 0 16px; font-size: 13px; }
    .btn--lg  { height: 40px; padding: 0 20px; font-size: 14px; }
    .btn--primary {
      background: var(--accent);
      color: #0C0C0E;
      border: none;
    }
    .btn--primary:hover:not(:disabled) {
      background: var(--accent-hover);
      box-shadow: var(--shadow-glow);
      transform: translateY(-1px);
    }
    .btn--secondary {
      background: transparent;
      color: var(--text-primary);
      border: 1px solid var(--border-default);
    }
    .btn--secondary:hover:not(:disabled) {
      background: var(--bg-elevated);
      border-color: var(--border-strong);
    }
    .btn--danger {
      background: transparent;
      color: var(--danger);
      border: 1px solid var(--danger);
    }
    .btn--danger:hover:not(:disabled) {
      background: var(--danger-dim);
    }
    .btn--ghost {
      background: transparent;
      color: var(--text-secondary);
      border: none;
    }
    .btn--ghost:hover:not(:disabled) {
      background: var(--bg-elevated);
      color: var(--text-primary);
    }
  `]
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() type = 'button';
}
