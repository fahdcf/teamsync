import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="backdrop" (click)="closed.emit()">
      <div class="panel" [class]="'panel--' + size" (click)="$event.stopPropagation()">
        <div class="panel__header">
          <h3 class="panel__title">{{ title }}</h3>
          <button class="panel__close" (click)="closed.emit()" aria-label="Close dialog">✕</button>
        </div>
        <div class="panel__body">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .panel {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      max-height: 90vh;
      overflow-y: auto;
    }
    .panel--sm { width: 360px; }
    .panel--md { width: 520px; }
    .panel--lg { width: 720px; }
    @media (max-width: 576px) {
      .backdrop { align-items: flex-end; }
      .panel { width: 100% !important; border-radius: var(--radius-lg) var(--radius-lg) 0 0; max-height: 85vh; }
    }
    .panel__header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1px solid var(--color-border);
    }
    .panel__title { margin: 0; font-size: 16px; font-weight: 600; }
    .panel__close {
      background: none; border: none; color: var(--color-muted);
      font-size: 18px; padding: 4px; line-height: 1;
    }
    .panel__close:hover { color: var(--color-text); }
    .panel__body { padding: 24px; }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.isOpen) this.closed.emit();
  }
}
