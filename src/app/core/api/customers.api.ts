import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageRequest, PageResponse } from '../models/pagination';
import { CustomerCreateDTO, CustomerUpdateDTO, CustomerViewDTO } from '../models/customer';

@Injectable({ providedIn: 'root' })
export class CustomersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly resource = `${this.baseUrl}/api/v1/customers`;

  create(payload: CustomerCreateDTO): Observable<CustomerViewDTO> {
    return this.http.post<CustomerViewDTO>(this.resource, payload);
  }

  update(id: string, payload: CustomerUpdateDTO): Observable<CustomerViewDTO> {
    return this.http.put<CustomerViewDTO>(`${this.resource}/${encodeURIComponent(id)}`, payload);
  }

  list(params?: PageRequest): Observable<PageResponse<CustomerViewDTO>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) httpParams = httpParams.set(key, String(value));
      });
    }
    return this.http.get<PageResponse<CustomerViewDTO>>(this.resource, { params: httpParams });
  }

  getById(id: string): Observable<CustomerViewDTO> {
    return this.http.get<CustomerViewDTO>(`${this.resource}/${encodeURIComponent(id)}`);
  }
}


