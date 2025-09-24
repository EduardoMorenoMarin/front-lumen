import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageRequest, PageResponse } from '../models/pagination';
import { ProductCreateDTO, ProductUpdateDTO, ProductViewDTO } from '../models/product';

@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly resource = `${this.baseUrl}/api/v1/products`;

  create(payload: ProductCreateDTO): Observable<ProductViewDTO> {
    return this.http.post<ProductViewDTO>(this.resource, payload);
  }

  update(id: string, payload: ProductUpdateDTO): Observable<ProductViewDTO> {
    return this.http.put<ProductViewDTO>(`${this.resource}/${encodeURIComponent(id)}`, payload);
  }

  list(params?: PageRequest & { categoryId?: string; isActive?: boolean }): Observable<PageResponse<ProductViewDTO>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) httpParams = httpParams.set(key, String(value));
      });
    }
    return this.http.get<PageResponse<ProductViewDTO>>(this.resource, { params: httpParams });
  }

  getById(id: string): Observable<ProductViewDTO> {
    return this.http.get<ProductViewDTO>(`${this.resource}/${encodeURIComponent(id)}`);
  }
}


