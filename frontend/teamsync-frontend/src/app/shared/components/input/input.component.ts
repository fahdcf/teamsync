import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => InputComponent),
    multi: true
  }],
  template: `
    <div class="field">
      <label *ngIf="label" class="field__label">{{ label }}</label>
      <input
        class="field__input"
        [class.field__input--error]="error"
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onTouched()">
      <span *ngIf="error" class="field__error">{{ error }}</span>
    </div>
  `,
  styles: [`
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field__label {
      font-size: 12px;
      font-weight: 400;
      color: var(--text-secondary);
    }
    .field__input {
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      padding: 0 12px;
      height: 36px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s;
    }
    .field__input::placeholder { color: var(--text-tertiary); }
    .field__input:focus { border-color: var(--border-default); }
    .field__input--error { border-color: var(--danger); }
    .field__input:disabled { opacity: 0.5; cursor: not-allowed; }
    .field__error { font-size: 12px; color: var(--danger); }
  `]
})
export class InputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() error = '';
  @Input() disabled = false;

  value = '';
  onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(v: string): void { this.value = v ?? ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.disabled = disabled; }

  onInput(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    this.onChange(this.value);
  }
}
