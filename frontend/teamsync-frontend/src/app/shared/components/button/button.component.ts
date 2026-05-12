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
      font-weight: 500;
      transition: opacity 0.15s, background 0.15s;
      white-space: nowrap;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn--sm  { padding: 6px 12px; font-size: 13px; }
    .btn--md  { padding: 10px 20px; font-size: 14px; }
    .btn--lg  { padding: 14px 28px; font-size: 16px; }
    .btn--primary   { background: var(--color-accent); color: #fff; }
    .btn--primary:hover:not(:disabled) { opacity: 0.85; }
    .btn--secondary { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); }
    .btn--secondary:hover:not(:disabled) { background: var(--color-border); }
    .btn--danger    { background: var(--color-danger); color: #fff; }
    .btn--danger:hover:not(:disabled) { opacity: 0.85; }
    .btn--ghost     { background: transparent; color: var(--color-text); }
    .btn--ghost:hover:not(:disabled) { background: rgba(255,255,255,0.06); }
  `]
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() type = 'button';
}
