import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-task-board',
  standalone: true,
  template: `<p>Task Board (coming soon)</p>`
})
export default class TaskBoardComponent {
  @Input() projectId = '';
}
