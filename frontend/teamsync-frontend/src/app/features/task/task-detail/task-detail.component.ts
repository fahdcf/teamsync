import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  template: `<p>Task Detail (coming soon)</p>`
})
export default class TaskDetailComponent {
  @Input() taskId = '';
  @Output() closed = new EventEmitter<void>();
}
