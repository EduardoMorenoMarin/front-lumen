import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageRequest, PageResponse } from '../models/pagination';
import { CategoryCreateDTO, CategoryUpdateDTO, CategoryViewDTO } from '../models/category';

@Injectable({ providedIn: 'root' })
export class CategoriesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly resource = `${this.baseUrl}/api/v1/categories`;

  create(payload: CategoryCreateDTO): Observable<CategoryViewDTO> {
    return this.http.post<CategoryViewDTO>(this.resource, payload);
  }

  update(id: string, payload: CategoryUpdateDTO): Observable<CategoryViewDTO> {
    return this.http.put<CategoryViewDTO>(`${this.resource}/${encodeURIComponent(id)}`, payload);
  }

  list(params?: PageRequest & { active?: boolean }): Observable<PageResponse<CategoryViewDTO>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (typeof value === 'boolean') {
          httpParams = httpParams.set(key, value ? 'true' : 'false');
          return;
        }
        httpParams = httpParams.set(key, String(value));
      });
    }
    return this.http.get<PageResponse<CategoryViewDTO>>(this.resource, { params: httpParams });
  }

  getById(id: string): Observable<CategoryViewDTO> {
    return this.http.get<CategoryViewDTO>(`${this.resource}/${encodeURIComponent(id)}`);
  }
}


