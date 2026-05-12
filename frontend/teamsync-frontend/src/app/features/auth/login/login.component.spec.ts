import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import LoginComponent from './login.component';
import { AuthService } from '../../../api/auth.service';
import { AuthStore } from '../../../store/auth.store';
import { TokenService } from '../../../core/services/token.service';
import { User } from '../../../shared/models/user.model';

const mockUser: User = { id: '1', username: 'ali', email: 'a@test.com', role: 'TEAM_MEMBER', createdAt: '' };

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let mockAuthService: { login: any; getMe: any };
  let mockAuthStore: { setUser: any };
  let mockTokenService: { setToken: any };
  let router: Router;

  beforeEach(async () => {
    mockAuthService = {
      login: vi.fn().mockReturnValue(of({ token: 'mock-token' })),
      getMe: vi.fn().mockReturnValue(of(mockUser))
    };
    mockAuthStore = { setUser: vi.fn() };
    mockTokenService = { setToken: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: TokenService, useValue: mockTokenService },
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('form is invalid when empty — onSubmit() does not call AuthService.login', () => {
    component.onSubmit();
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('form is invalid with bad email format', () => {
    component.form.setValue({ email: 'not-an-email', password: 'pass123' });
    expect(component.form.invalid).toBe(true);
  });

  it('onSubmit() calls AuthService.login() with form values when valid', () => {
    component.form.setValue({ email: 'a@test.com', password: 'pass123' });
    component.onSubmit();
    expect(mockAuthService.login).toHaveBeenCalledWith({ email: 'a@test.com', password: 'pass123' });
  });

  it('on successful login → TokenService.setToken called → Router.navigate called with /dashboard', () => {
    component.form.setValue({ email: 'a@test.com', password: 'pass123' });
    component.onSubmit();
    expect(mockTokenService.setToken).toHaveBeenCalledWith('mock-token');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('isLoading is set to true during submission, false after', () => {
    const loginSubject = new Subject<{ token: string }>();
    mockAuthService.login.mockReturnValue(loginSubject.asObservable());
    component.form.setValue({ email: 'a@test.com', password: 'pass123' });
    component.onSubmit();
    expect(component.isLoading).toBe(true);
    loginSubject.error({});
    expect(component.isLoading).toBe(false);
  });
});
