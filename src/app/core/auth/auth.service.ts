import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, switchMap, tap } from 'rxjs';
import { AuthApi } from '../api';
import { AuthLoginRequest, AuthLoginResponse, MeResponse } from '../models/auth';

const TOKEN_KEY = 'access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);

  private readonly currentUserSubject = new BehaviorSubject<MeResponse | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  set token(value: string | null) {
    if (value) {
      localStorage.setItem(TOKEN_KEY, value);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  login(payload: AuthLoginRequest): Observable<MeResponse> {
    return this.authApi.login(payload).pipe(
      tap((res: AuthLoginResponse) => {
        if (res?.accessToken) {
          this.token = res.accessToken;
        }
      }),
      switchMap(() => this.me(true))
    );
  }

  logout(): void {
    this.token = null;
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  me(force = false): Observable<MeResponse> {
    if (!force) {
      const cached = this.currentUserSubject.value;
      if (cached) {
        return of(cached);
      }
    }

    return this.authApi.me().pipe(
      tap((me) => this.currentUserSubject.next(me))
    );
  }
}
