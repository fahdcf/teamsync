import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from './auth.store';
import { User } from '../shared/models/user.model';
import { environment } from '../../environments/environment';

const mockUser: User = { id: '1', username: 'ali', email: 'a@test.com', role: 'TEAM_MEMBER', createdAt: '' };

describe('AuthStore', () => {
  let store: AuthStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthStore, provideHttpClient(), provideHttpClientTesting()]
    });
    store = TestBed.inject(AuthStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('setUser() updates user$ observable', async () => {
    store.setUser(mockUser);
    const u = await firstValueFrom(store.user$);
    expect(u).toEqual(mockUser);
  });

  it('clearUser() sets user$ to null', async () => {
    store.setUser(mockUser);
    store.clearUser();
    const u = await firstValueFrom(store.user$);
    expect(u).toBeNull();
  });

  it('isAuthenticated$ emits true when user is set', async () => {
    store.setUser(mockUser);
    const auth = await firstValueFrom(store.isAuthenticated$);
    expect(auth).toBe(true);
  });

  it('isAuthenticated$ emits false when user is null', async () => {
    store.clearUser();
    const auth = await firstValueFrom(store.isAuthenticated$);
    expect(auth).toBe(false);
  });

  it('init() calls GET /users/me and sets the user', async () => {
    const initPromise = firstValueFrom(store.init());
    const req = httpMock.expectOne(`${environment.apiUrl}/users/me`);
    req.flush(mockUser);
    await initPromise;
    expect(store.getUser()).toEqual(mockUser);
  });
});
