import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';
import { TokenService } from '../services/token.service';
import { AuthStore } from '../../store/auth.store';
import { environment } from '../../../environments/environment';

describe('HTTP security integration', () => {
  let http: HttpClient;
  let requests: HttpTestingController;
  let tokens: TokenService;
  const account = { clearUser: vi.fn() };
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const toastr = { error: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
      provideHttpClientTesting(),
      { provide: AuthStore, useValue: account },
      { provide: Router, useValue: router },
      { provide: ToastrService, useValue: toastr },
    ] });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenService);
    tokens.setToken('test-token');
  });
  afterEach(() => { requests.verify(); sessionStorage.clear(); });

  it('attaches the bearer token to API calls', () => {
    http.get(environment.apiUrl + '/users/me').subscribe();
    const request = requests.expectOne(environment.apiUrl + '/users/me');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush({});
  });
  it('does not disclose the token to another host or a URL prefix lookalike', () => {
    for (const url of ['https://outside.example/data', environment.apiUrl + '.attacker.example/data']) {
      http.get(url).subscribe();
      const request = requests.expectOne(url);
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush({});
    }
  });
  it('allows a fresh login without attaching stale credentials', () => {
    http.post(environment.apiUrl + '/auth/login', {email: 'user@test.example', password: 'test'}).subscribe();
    const request = requests.expectOne(environment.apiUrl + '/auth/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({token: 'new-token'});
  });
  it('clears credentials and account state on 401', () => {
    http.get(environment.apiUrl + '/users/me').subscribe({error: () => {}});
    requests.expectOne(environment.apiUrl + '/users/me').flush({}, {status: 401, statusText: 'Unauthorized'});
    expect(tokens.getToken()).toBeNull();
    expect(account.clearUser).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
  it('keeps authentication on 403 and explains the denied operation', () => {
    http.put(environment.apiUrl + '/projects/test/archive', {}).subscribe({error: () => {}});
    requests.expectOne(environment.apiUrl + '/projects/test/archive').flush({}, {status: 403, statusText: 'Forbidden'});
    expect(tokens.getToken()).toBe('test-token');
    expect(account.clearUser).not.toHaveBeenCalled();
    expect(toastr.error).toHaveBeenCalledWith("You don't have permission to do this");
  });
});
