import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { WorkspaceService } from './workspace.service';
import { environment } from '../../environments/environment';

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WorkspaceService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(WorkspaceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll() sends GET /workspaces', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/workspaces`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('addMember() sends POST with { email } body', () => {
    service.addMember('ws-1', 'user@test.com').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/workspaces/ws-1/members`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'user@test.com' });
    req.flush({});
  });

  it('removeMember() sends DELETE to correct URL', () => {
    service.removeMember('ws-1', 'user-99').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/workspaces/ws-1/members/user-99`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
