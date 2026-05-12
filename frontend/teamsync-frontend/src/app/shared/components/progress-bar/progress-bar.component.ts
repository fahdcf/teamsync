import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bar-track">
      <div class="bar-fill" [style.width.%]="value" [class]="colorClass"></div>
    </div>
  `,
  styles: [`
    .bar-track {
      height: 6px; background: var(--color-border); border-radius: 100px; overflow: hidden;
    }
    .bar-fill { height: 100%; border-radius: 100px; transition: width 0.4s ease; }
    .bar-fill.green  { background: var(--color-success); }
    .bar-fill.yellow { background: var(--color-warning); }
    .bar-fill.red    { background: var(--color-danger); }
  `]
})
export class ProgressBarComponent {
  @Input() value = 0;

  get colorClass(): string {
    if (this.value >= 70) return 'green';
    if (this.value >= 40) return 'yellow';
    return 'red';
  }
}
