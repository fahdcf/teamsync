import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TokenService] });
    service = TestBed.inject(TokenService);
    sessionStorage.clear();
  });

  afterEach(() => sessionStorage.clear());

  it('setToken() saves to sessionStorage', () => {
    service.setToken('abc123');
    expect(sessionStorage.getItem('teamsync_token')).toBe('abc123');
  });

  it('getToken() retrieves from sessionStorage', () => {
    sessionStorage.setItem('teamsync_token', 'xyz789');
    expect(service.getToken()).toBe('xyz789');
  });

  it('removeToken() removes from sessionStorage', () => {
    sessionStorage.setItem('teamsync_token', 'tok');
    service.removeToken();
    expect(sessionStorage.getItem('teamsync_token')).toBeNull();
  });

  it('hasToken() returns false when empty', () => {
    expect(service.hasToken()).toBe(false);
  });

  it('rejects expired and malformed tokens', () => {
    for (const value of ['malformed', 'header.' + btoa(JSON.stringify({exp: 1})) + '.signature']) {
      service.setToken(value);
      expect(service.hasToken()).toBe(false);
      expect(service.getToken()).toBeNull();
    }
  });

  it('hasToken() returns true when token is set', () => {
    service.setToken('header.' + btoa(JSON.stringify({exp: Math.floor(Date.now()/1000)+60})) + '.signature');
    expect(service.hasToken()).toBe(true);
  });
});
