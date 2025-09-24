import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const jwtInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  const url = request.url;
  const isPublic = /\/public\//.test(url);
  const isLogin = /\/auth\/login$/.test(url);

  let req = request;
  if (token && !isPublic && !isLogin) {
    req = request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};


