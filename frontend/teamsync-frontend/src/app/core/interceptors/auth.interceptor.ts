import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TokenService } from '../services/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenService).getToken();
  const api = environment.apiUrl.replace(/\/$/, '');
  const isPublic = ['/auth/login', '/auth/register', '/patterns', '/public/stats', '/public/health']
    .some(path => req.url === api + path);
  if (token && !isPublic && (req.url === api || req.url.startsWith(api + '/'))) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
