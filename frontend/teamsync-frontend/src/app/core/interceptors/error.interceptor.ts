import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TokenService } from '../services/token.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const tokenService = inject(TokenService);

  // Auth endpoints handle their own errors with inline messages
  const isAuthEndpoint = req.url.includes('/auth/');

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!isAuthEndpoint) {
        if (error.status === 0) {
          toastr.error('Cannot connect to server');
        } else if (error.status === 401) {
          tokenService.removeToken();
          router.navigate(['/login']);
          toastr.error('Session expired. Please sign in again.');
        } else if (error.status === 403) {
          toastr.error("You don't have permission to do this");
        } else if (error.status === 404) {
          toastr.error('Resource not found');
        } else if (error.status >= 500) {
          toastr.error('Server error. Please try again.');
        }
      }
      return throwError(() => error);
    })
  );
};
