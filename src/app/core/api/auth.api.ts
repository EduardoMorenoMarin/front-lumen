import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthLoginRequest, AuthLoginResponse, MeResponse } from '../models/auth';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly resource = `${this.baseUrl}/api/v1/auth`;

  login(payload: AuthLoginRequest): Observable<AuthLoginResponse> {
    return this.http.post<AuthLoginResponse>(`${this.resource}/login`, payload);
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.resource}/me`);
  }
}


