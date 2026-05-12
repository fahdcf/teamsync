import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import TaskBoardComponent from './task-board.component';
import { TaskService } from '../../../api/task.service';
import { Task } from '../../../shared/models/task.model';

const makeTask = (id: string, status: Task['status']): Task => ({
  id, title: `Task ${id}`, description: '', priority: 'MEDIUM',
  status, assignee: null, project: null as any, dependencies: [],
  dueDate: null, createdAt: '', updatedAt: ''
});

describe('TaskBoardComponent', () => {
  let fixture: ComponentFixture<TaskBoardComponent>;
  let component: TaskBoardComponent;
  let mockTaskService: { getByProject: any; changeStatus: any; create: any; delete: any };

  beforeEach(async () => {
    mockTaskService = {
      getByProject: vi.fn().mockReturnValue(of([])),
      changeStatus: vi.fn().mockReturnValue(of({})),
      create: vi.fn().mockReturnValue(of(makeTask('new', 'TODO'))),
      delete: vi.fn().mockReturnValue(of(null))
    };

    await TestBed.configureTestingModule({
      imports: [TaskBoardComponent],
      providers: [
        provideAnimations(),
        provideRouter([]),
        { provide: TaskService, useValue: mockTaskService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskBoardComponent);
    component = fixture.componentInstance;
    component.projectId = 'proj-1';
  });

  it('loadTasks() distributes tasks into correct columns by status', () => {
    const tasks = [
      makeTask('1', 'TODO'),
      makeTask('2', 'TODO'),
      makeTask('3', 'IN_PROGRESS'),
      makeTask('4', 'DONE'),
    ];
    mockTaskService.getByProject.mockReturnValue(of(tasks));
    fixture.detectChanges();

    expect(component.columns.find(c => c.status === 'TODO')!.tasks.length).toBe(2);
    expect(component.columns.find(c => c.status === 'IN_PROGRESS')!.tasks.length).toBe(1);
    expect(component.columns.find(c => c.status === 'DONE')!.tasks.length).toBe(1);
    expect(component.columns.find(c => c.status === 'BLOCKED')!.tasks.length).toBe(0);
  });

  it('onDrop() within same column calls moveItemInArray, not TaskService.changeStatus', () => {
    fixture.detectChanges();
    const col = component.columns[0];
    col.tasks = [makeTask('a', 'TODO'), makeTask('b', 'TODO')];

    const container = { data: col.tasks, id: 'TODO' } as any;
    const event = { previousContainer: container, container, previousIndex: 0, currentIndex: 1 } as unknown as CdkDragDrop<Task[]>;

    component.onDrop(event);

    expect(mockTaskService.changeStatus).not.toHaveBeenCalled();
    expect(col.tasks[0].id).toBe('b');
    expect(col.tasks[1].id).toBe('a');
  });

  it('onDrop() to different column calls TaskService.changeStatus with correct status', () => {
    fixture.detectChanges();
    const todoCol = component.columns.find(c => c.status === 'TODO')!;
    const ipCol   = component.columns.find(c => c.status === 'IN_PROGRESS')!;
    todoCol.tasks = [makeTask('t1', 'TODO')];
    ipCol.tasks   = [];

    const prevContainer = { data: todoCol.tasks, id: 'TODO' } as any;
    const nextContainer = { data: ipCol.tasks,   id: 'IN_PROGRESS' } as any;
    const event = { previousContainer: prevContainer, container: nextContainer, previousIndex: 0, currentIndex: 0 } as unknown as CdkDragDrop<Task[]>;

    component.onDrop(event);

    expect(mockTaskService.changeStatus).toHaveBeenCalledWith('t1', { status: 'IN_PROGRESS' });
  });

  it('on changeStatus error → reverts task to original column', () => {
    fixture.detectChanges();
    const errSubject = new Subject<any>();
    mockTaskService.changeStatus.mockReturnValue(errSubject.asObservable());

    const todoCol = component.columns.find(c => c.status === 'TODO')!;
    const ipCol   = component.columns.find(c => c.status === 'IN_PROGRESS')!;
    todoCol.tasks = [makeTask('t1', 'TODO')];
    ipCol.tasks   = [];

    const prevContainer = { data: todoCol.tasks, id: 'TODO' } as any;
    const nextContainer = { data: ipCol.tasks,   id: 'IN_PROGRESS' } as any;
    const event = { previousContainer: prevContainer, container: nextContainer, previousIndex: 0, currentIndex: 0 } as unknown as CdkDragDrop<Task[]>;

    component.onDrop(event);
    expect(ipCol.tasks.length).toBe(1);

    errSubject.error({ status: 400 });
    expect(ipCol.tasks.length).toBe(0);
    expect(todoCol.tasks.length).toBe(1);
  });
});
