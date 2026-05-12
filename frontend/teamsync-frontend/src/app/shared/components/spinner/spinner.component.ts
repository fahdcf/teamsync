import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="spinner" [class]="'spinner--' + size + ' spinner--' + color"></div>`,
  styles: [`
    .spinner {
      border-radius: 50%;
      border-style: solid;
      border-color: transparent;
      border-top-color: var(--color-accent);
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    .spinner--sm  { width: 16px; height: 16px; border-width: 2px; }
    .spinner--md  { width: 24px; height: 24px; border-width: 3px; }
    .spinner--lg  { width: 40px; height: 40px; border-width: 4px; }
    .spinner--accent  { border-top-color: var(--color-accent); }
    .spinner--success { border-top-color: var(--color-success); }
    .spinner--danger  { border-top-color: var(--color-danger); }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() color = 'accent';
}
