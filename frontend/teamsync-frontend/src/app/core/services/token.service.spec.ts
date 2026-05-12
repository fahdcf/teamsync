import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TokenService] });
    service = TestBed.inject(TokenService);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('setToken() saves to localStorage', () => {
    service.setToken('abc123');
    expect(localStorage.getItem('teamsync_token')).toBe('abc123');
  });

  it('getToken() retrieves from localStorage', () => {
    localStorage.setItem('teamsync_token', 'xyz789');
    expect(service.getToken()).toBe('xyz789');
  });

  it('removeToken() removes from localStorage', () => {
    localStorage.setItem('teamsync_token', 'tok');
    service.removeToken();
    expect(localStorage.getItem('teamsync_token')).toBeNull();
  });

  it('hasToken() returns false when empty', () => {
    expect(service.hasToken()).toBe(false);
  });

  it('hasToken() returns true when token is set', () => {
    service.setToken('sometoken');
    expect(service.hasToken()).toBe(true);
  });
});
