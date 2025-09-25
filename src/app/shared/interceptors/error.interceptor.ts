import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../services/toast.service';

export function errorInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const router = inject(Router);
  const authService = inject(AuthService);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        authService.logout();
        toastService.error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
        router.navigate(['/login']);
      } else if (error.status >= 400) {
        const message =
          (typeof error.error === 'string' && error.error) ||
          error.error?.message ||
          error.message ||
          'Ocurrió un error inesperado.';
        toastService.error(message);
      }

      return throwError(() => error);
    })
  );
}
