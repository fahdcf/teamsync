import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('login() sends POST to /auth/login with correct body', () => {
    const req = { email: 'a@test.com', password: 'pass123' };
    service.login(req).subscribe();
    const httpReq = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(httpReq.request.method).toBe('POST');
    expect(httpReq.request.body).toEqual(req);
    httpReq.flush({ token: 'mock-token' });
  });

  it('register() sends POST to /auth/register', () => {
    const req = { username: 'ali', email: 'a@test.com', password: 'pass123', role: 'TEAM_MEMBER' as const };
    service.register(req).subscribe();
    const httpReq = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(httpReq.request.method).toBe('POST');
    httpReq.flush({ id: '1', username: 'ali', email: 'a@test.com', role: 'TEAM_MEMBER', createdAt: '' });
  });

  it('getMe() sends GET to /users/me', () => {
    service.getMe().subscribe();
    const httpReq = httpMock.expectOne(`${environment.apiUrl}/users/me`);
    expect(httpReq.request.method).toBe('GET');
    httpReq.flush({ id: '1', username: 'ali', email: 'a@test.com', role: 'TEAM_MEMBER', createdAt: '' });
  });
});
