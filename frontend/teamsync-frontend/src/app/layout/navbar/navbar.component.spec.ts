import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BehaviorSubject, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { NavbarComponent } from './navbar.component';
import { AuthStore } from '../../store/auth.store';
import { NotificationStore } from '../../store/notification.store';
import { TokenService } from '../../core/services/token.service';
import { Notification } from '../../shared/models/notification.model';
import { User } from '../../shared/models/user.model';

const mockUser: User = { id: '1', username: 'ali', email: 'a@test.com', role: 'TEAM_MEMBER', createdAt: '' };

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;
  let component: NavbarComponent;
  let notificationsSubject: BehaviorSubject<Notification[]>;
  let userSubject: BehaviorSubject<User | null>;
  let mockAuthStore: Partial<AuthStore>;
  let mockNotifStore: Partial<NotificationStore>;
  let mockTokenService: { removeToken: any };
  let router: Router;

  beforeEach(async () => {
    notificationsSubject = new BehaviorSubject<Notification[]>([]);
    userSubject = new BehaviorSubject<User | null>(null);

    mockAuthStore = {
      user$: userSubject.asObservable(),
      isAuthenticated$: userSubject.pipe(map(u => u !== null)),
      clearUser: vi.fn(),
      getUser: vi.fn().mockReturnValue(null),
      setUser: vi.fn()
    };

    mockNotifStore = {
      notifications$: notificationsSubject.asObservable(),
      unreadCount$: notificationsSubject.pipe(map(n => n.filter(x => !x.readStatus).length)),
      markRead: vi.fn(),
      markAllRead: vi.fn(),
      load: vi.fn(),
      startPolling: vi.fn(),
      stopPolling: vi.fn()
    };

    mockTokenService = { removeToken: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: NotificationStore, useValue: mockNotifStore },
        { provide: TokenService, useValue: mockTokenService },
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('unreadCount badge not visible when unreadCount$ = 0', () => {
    notificationsSubject.next([]);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.notif-badge');
    expect(badge).toBeNull();
  });

  it('unreadCount badge visible and shows correct number when unreadCount$ > 0', () => {
    const unreadNotif: Notification = {
      id: 'n1', message: 'You were assigned a task', type: 'IN_APP',
      readStatus: false, createdAt: new Date().toISOString(),
      recipient: mockUser
    };
    notificationsSubject.next([unreadNotif]);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.notif-badge');
    expect(badge).not.toBeNull();
    expect(badge.textContent.trim()).toBe('1');
  });

  it('logout() calls AuthStore.clearUser(), TokenService.removeToken(), Router.navigate', () => {
    component.logout();
    expect(mockAuthStore.clearUser).toHaveBeenCalled();
    expect(mockTokenService.removeToken).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('submits the starter kit selected in the workspace form once', () => {
    component.activeCreateModal = 'workspace';
    component.workspaceForm.patchValue({ name: 'Campus team' });
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select[formControlName="starterKit"]') as HTMLSelectElement;
    select.value = 'UNIVERSITY_PROJECT';
    select.dispatchEvent(new Event('change'));
    const form = select.closest('form')!;
    form.dispatchEvent(new Event('submit'));
    form.dispatchEvent(new Event('submit'));

    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne(req => req.method === 'POST' && req.url.endsWith('/workspaces'));
    expect(request.request.body).toEqual({ name: 'Campus team', description: '', starterKit: 'UNIVERSITY_PROJECT' });
    request.flush({ id: 'campus', name: 'Campus team' });
    expect(component.activeCreateModal).toBeNull();
  });
});
