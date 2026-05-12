import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal [isOpen]="isOpen" [title]="title" size="sm" (closed)="cancelled.emit()">
      <p class="message">{{ message }}</p>
      <div class="actions">
        <app-button variant="secondary" size="sm" (click)="cancelled.emit()">Cancel</app-button>
        <app-button [variant]="danger ? 'danger' : 'primary'" size="sm" (click)="confirmed.emit()">
          {{ confirmLabel }}
        </app-button>
      </div>
    </app-modal>
  `,
  styles: [`
    .message { color: var(--color-muted); margin: 0 0 20px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; }
  `]
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmLabel = 'Confirm';
  @Input() danger = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
