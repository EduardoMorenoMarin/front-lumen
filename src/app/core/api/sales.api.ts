import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SaleCreateDTO, SaleViewDTO } from '../models/sale';

@Injectable({ providedIn: 'root' })
export class SalesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly resource = `${this.baseUrl}/api/v1/sales`;

  create(payload: SaleCreateDTO): Observable<SaleViewDTO> {
    return this.http.post<SaleViewDTO>(this.resource, payload);
  }

  getById(id: string): Observable<SaleViewDTO> {
    return this.http.get<SaleViewDTO>(`${this.resource}/${encodeURIComponent(id)}`);
  }

}


