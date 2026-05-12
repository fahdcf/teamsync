import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import LoginComponent from './features/auth/login/login.component';
import RegisterComponent from './features/auth/register/register.component';
import { TokenService } from './core/services/token.service';
import { AuthStore } from './store/auth.store';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { environment } from '../environments/environment';
import { User } from './shared/models/user.model';

const BASE = environment.apiUrl;
const mockUser: User = { id: '1', username: 'Ahmed', email: 'a@test.com', role: 'TEAM_MEMBER', createdAt: '' };

function makeProviders() {
  return [
    provideHttpClient(withInterceptors([errorInterceptor])),
    provideHttpClientTesting(),
    provideRouter([]),
    TokenService,
    AuthStore,
    { provide: ToastrService, useValue: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }
  ];
}

describe('Auth Flow Integration', () => {
  let httpMock: HttpTestingController;
  let router: Router;
  let tokenService: TokenService;
  let toastr: { error: any };

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Login flow', () => {
    let fixture: ComponentFixture<LoginComponent>;
    let component: LoginComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [LoginComponent],
        providers: makeProviders()
      }).compileComponents();

      httpMock = TestBed.inject(HttpTestingController);
      router = TestBed.inject(Router);
      tokenService = TestBed.inject(TokenService);
      toastr = TestBed.inject(ToastrService) as any;
      vi.spyOn(router, 'navigate').mockResolvedValue(true);

      fixture = TestBed.createComponent(LoginComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('full login flow: form submit → POST /auth/login → GET /users/me → navigate /dashboard', () => {
      component.form.setValue({ email: 'a@test.com', password: 'pass123' });
      component.onSubmit();

      const loginReq = httpMock.expectOne(`${BASE}/auth/login`);
      expect(loginReq.request.method).toBe('POST');
      expect(loginReq.request.body).toEqual({ email: 'a@test.com', password: 'pass123' });
      loginReq.flush({ token: 'mock-token' });

      const meReq = httpMock.expectOne(`${BASE}/users/me`);
      expect(meReq.request.method).toBe('GET');
      meReq.flush(mockUser);

      expect(tokenService.getToken()).toBe('mock-token');
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('login with wrong credentials: flush 401 → toastr.error called → navigate NOT to /dashboard', () => {
      component.form.setValue({ email: 'a@test.com', password: 'wrongpass' });
      component.onSubmit();

      const loginReq = httpMock.expectOne(`${BASE}/auth/login`);
      loginReq.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(toastr.error).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('Register flow', () => {
    let fixture: ComponentFixture<RegisterComponent>;
    let component: RegisterComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [RegisterComponent],
        providers: makeProviders()
      }).compileComponents();

      httpMock = TestBed.inject(HttpTestingController);
      router = TestBed.inject(Router);
      tokenService = TestBed.inject(TokenService);
      vi.spyOn(router, 'navigate').mockResolvedValue(true);

      fixture = TestBed.createComponent(RegisterComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('register then auto-login: POST /auth/register → POST /auth/login → GET /users/me → navigate /dashboard', () => {
      component.form.setValue({ username: 'Ahmed', email: 'a@test.com', password: 'pass123', role: 'TEAM_MEMBER' });
      component.onSubmit();

      const registerReq = httpMock.expectOne(`${BASE}/auth/register`);
      expect(registerReq.request.method).toBe('POST');
      registerReq.flush(mockUser, { status: 201, statusText: 'Created' });

      const loginReq = httpMock.expectOne(`${BASE}/auth/login`);
      expect(loginReq.request.method).toBe('POST');
      loginReq.flush({ token: 'mock-token' });

      const meReq = httpMock.expectOne(`${BASE}/users/me`);
      meReq.flush(mockUser);

      expect(tokenService.getToken()).toBe('mock-token');
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});
