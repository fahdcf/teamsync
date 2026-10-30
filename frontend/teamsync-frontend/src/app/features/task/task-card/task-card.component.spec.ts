import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TaskCardComponent } from './task-card.component';
import { Task } from '../../../shared/models/task.model';

const baseTask: Task = {
  id: 'task-1',
  title: 'Fix login bug',
  description: '',
  priority: 'HIGH',
  status: 'TODO',
  assignee: null,
  project: null as any,
  dependencies: [],
  dueDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('TaskCardComponent', () => {
  let fixture: ComponentFixture<TaskCardComponent>;
  let component: TaskCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;
    // detectChanges called inside each test after setting task
  });

  it('renders task title', () => {
    component.task = { ...baseTask };
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.tc-title');
    expect(el.textContent.trim()).toContain('Fix login bug');
  });

  it('shows overdue class when dueDate is in the past and status is not DONE', () => {
    component.task = { ...baseTask, dueDate: '2020-01-01', status: 'TODO' };
    fixture.detectChanges();
    expect(component.isOverdue).toBe(true);
    const dateEl = fixture.nativeElement.querySelector('.tc-date');
    expect(dateEl?.classList.contains('overdue')).toBe(true);
  });

  it('does not show overdue class for DONE tasks', () => {
    component.task = { ...baseTask, dueDate: '2020-01-01', status: 'DONE' };
    fixture.detectChanges();
    expect(component.isOverdue).toBe(false);
  });

  it('cardClick EventEmitter emits on card click', () => {
    component.task = { ...baseTask };
    fixture.detectChanges();
    let emitted = false;
    component.cardClick.subscribe(() => { emitted = true; });
    fixture.nativeElement.querySelector('.tc').click();
    expect(emitted).toBe(true);
  });

  it('priority badge displays correct variant for CRITICAL', () => {
    component.task = { ...baseTask, priority: 'CRITICAL' };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tc-priority').classList.contains('critical')).toBe(true);
  });
});
