import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageRequest, PageResponse } from '../models/pagination';
import { UserCreateDTO, UserDTO, UserStatusUpdateDTO } from '../models/user';

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly resource = `${this.baseUrl}/api/v1/users`;

  create(payload: UserCreateDTO): Observable<UserDTO> {
    return this.http.post<UserDTO>(this.resource, payload);
  }

  list(params?: PageRequest): Observable<PageResponse<UserDTO>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) httpParams = httpParams.set(key, String(value));
      });
    }
    return this.http.get<PageResponse<UserDTO>>(this.resource, { params: httpParams });
  }

  getById(id: string): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.resource}/${encodeURIComponent(id)}`);
  }

  updateStatus(id: string, payload: UserStatusUpdateDTO): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${this.resource}/${encodeURIComponent(id)}/status`, payload);
  }
}


