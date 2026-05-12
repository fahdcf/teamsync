import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import TaskBoardComponent from './features/task/task-board/task-board.component';
import { TaskService } from './api/task.service';
import { Task } from './shared/models/task.model';

const makeTask = (id: string, status: Task['status']): Task => ({
  id, title: `Task ${id}`, description: '', priority: 'MEDIUM',
  status, assignee: null, project: null as any, dependencies: [],
  dueDate: null, createdAt: '', updatedAt: ''
});

describe('Task Flow Integration', () => {
  let fixture: ComponentFixture<TaskBoardComponent>;
  let component: TaskBoardComponent;
  let mockTaskService: { getByProject: any; changeStatus: any; create: any; delete: any };

  beforeEach(async () => {
    mockTaskService = {
      getByProject: vi.fn().mockReturnValue(of([])),
      changeStatus: vi.fn().mockReturnValue(of({})),
      create: vi.fn().mockReturnValue(of(makeTask('new-1', 'TODO'))),
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
    fixture.detectChanges();
  });

  it('initial render shows 5 columns, all empty', () => {
    const columns = fixture.debugElement.queryAll(By.css('.column'));
    expect(columns.length).toBe(5);
    const emptyStates = fixture.debugElement.queryAll(By.css('app-empty-state'));
    expect(emptyStates.length).toBe(5);
  });

  it('create task and see it in board: open modal → fill → submit → task appears in TODO column', () => {
    const addBtns = fixture.debugElement.queryAll(By.css('.add-btn'));
    addBtns[0].nativeElement.click();
    fixture.detectChanges();

    expect(component.isCreateModalOpen).toBe(true);

    component.createForm.setValue({ title: 'Test Task', description: '', priority: 'HIGH', dueDate: '' });
    component.createTask();
    fixture.detectChanges();

    const todoCol = component.columns.find(c => c.status === 'TODO')!;
    expect(todoCol.tasks.length).toBe(1);
    expect(todoCol.tasks[0].id).toBe('new-1');
    expect(component.isCreateModalOpen).toBe(false);
  });

  it('drag task to new column: onDrop calls TaskService.changeStatus with correct status', () => {
    const todoCol = component.columns.find(c => c.status === 'TODO')!;
    const ipCol   = component.columns.find(c => c.status === 'IN_PROGRESS')!;
    todoCol.tasks = [makeTask('t1', 'TODO')];
    ipCol.tasks   = [];

    const prevContainer = { data: todoCol.tasks, id: 'TODO' } as any;
    const nextContainer = { data: ipCol.tasks,   id: 'IN_PROGRESS' } as any;
    const event = {
      previousContainer: prevContainer, container: nextContainer,
      previousIndex: 0, currentIndex: 0
    } as unknown as CdkDragDrop<Task[]>;

    component.onDrop(event);

    expect(mockTaskService.changeStatus).toHaveBeenCalledWith('t1', { status: 'IN_PROGRESS' });
    expect(ipCol.tasks.length).toBe(1);
  });

  it('invalid status transition: flush 400 → task reverts to original column', () => {
    mockTaskService.changeStatus.mockReturnValue(throwError(() => ({ status: 400 })));

    const ipCol  = component.columns.find(c => c.status === 'IN_PROGRESS')!;
    const doneCol = component.columns.find(c => c.status === 'DONE')!;
    ipCol.tasks   = [makeTask('t2', 'IN_PROGRESS')];
    doneCol.tasks = [];

    const prevContainer = { data: ipCol.tasks,   id: 'IN_PROGRESS' } as any;
    const nextContainer = { data: doneCol.tasks,  id: 'DONE' } as any;
    const event = {
      previousContainer: prevContainer, container: nextContainer,
      previousIndex: 0, currentIndex: 0
    } as unknown as CdkDragDrop<Task[]>;

    component.onDrop(event);

    expect(doneCol.tasks.length).toBe(0);
    expect(ipCol.tasks.length).toBe(1);
  });
});
