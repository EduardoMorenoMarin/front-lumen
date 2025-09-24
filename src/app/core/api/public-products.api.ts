import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageRequest, PageResponse } from '../models/pagination';
import { PublicProductView } from '../models/public';

@Injectable({ providedIn: 'root' })
export class PublicProductsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly resource = `${this.baseUrl}/api/v1/public/products`;

  list(params?: PageRequest & { categoryId?: string }): Observable<PageResponse<PublicProductView>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<PageResponse<PublicProductView>>(this.resource, { params: httpParams });
  }

  getById(id: string): Observable<PublicProductView> {
    return this.http.get<PublicProductView>(`${this.resource}/${encodeURIComponent(id)}`);
  }
}


