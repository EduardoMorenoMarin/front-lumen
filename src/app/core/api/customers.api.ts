import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CustomerCreateDTO,
  CustomerPatchDTO,
  CustomerPutDTO,
  CustomerViewDTO
} from '../models/customer';

@Injectable({ providedIn: 'root' })
export class CustomersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly resource = `${this.baseUrl}/api/v1/customers`;

  list(): Observable<CustomerViewDTO[]> {
    return this.http.get<CustomerViewDTO[]>(this.resource);
  }

  getById(id: string): Observable<CustomerViewDTO> {
    return this.http.get<CustomerViewDTO>(`${this.resource}/${encodeURIComponent(id)}`);
  }

  create(payload: CustomerCreateDTO): Observable<CustomerViewDTO> {
    return this.http.post<CustomerViewDTO>(this.resource, payload);
  }

  replace(id: string, payload: CustomerPutDTO): Observable<CustomerViewDTO> {
    return this.http.put<CustomerViewDTO>(`${this.resource}/${encodeURIComponent(id)}`, payload);
  }

  updatePartial(id: string, payload: CustomerPatchDTO): Observable<CustomerViewDTO> {
    return this.http.patch<CustomerViewDTO>(`${this.resource}/${encodeURIComponent(id)}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${encodeURIComponent(id)}`);
  }
}

