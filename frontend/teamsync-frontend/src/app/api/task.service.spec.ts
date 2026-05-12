import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TaskService } from './task.service';
import { environment } from '../../environments/environment';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getByProject() sends GET /projects/{id}/tasks', () => {
    service.getByProject('proj-1').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/projects/proj-1/tasks`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('changeStatus() sends PUT /tasks/{id}/status with body', () => {
    service.changeStatus('task-1', { status: 'IN_REVIEW' }).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/task-1/status`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ status: 'IN_REVIEW' });
    req.flush({});
  });

  it('undo() sends POST /tasks/undo', () => {
    service.undo().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/undo`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('getByProject() with filters appends correct query params', () => {
    service.getByProject('proj-1', { status: 'TODO', priority: 'HIGH' }).subscribe();
    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/projects/proj-1/tasks`);
    expect(req.request.params.get('status')).toBe('TODO');
    expect(req.request.params.get('priority')).toBe('HIGH');
    req.flush([]);
  });
});
