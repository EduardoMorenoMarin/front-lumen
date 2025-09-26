import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageRequest, PageResponse } from '../models/pagination';
import { PublicCategoryView } from '../models/public';

@Injectable({ providedIn: 'root' })
export class PublicCategoriesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly resource = `${this.baseUrl}/public/categories`;
  private readonly requestTimeoutMs = 10000;

  list(params?: PageRequest): Observable<PageResponse<PublicCategoryView>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http
      .get<PageResponse<PublicCategoryView>>(this.resource, { params: httpParams })
      .pipe(timeout(this.requestTimeoutMs));
  }

  getById(id: string): Observable<PublicCategoryView> {
    return this.http
      .get<PublicCategoryView>(`${this.resource}/${encodeURIComponent(id)}`)
      .pipe(timeout(this.requestTimeoutMs));
  }
}


