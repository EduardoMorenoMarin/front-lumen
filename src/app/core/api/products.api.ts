import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PageRequest, PageResponse } from '../models/pagination';
import {
  ProductCreateDTO,
  ProductPatchDTO,
  ProductReplaceDTO,
  ProductViewDTO
} from '../models/product';

export interface ProductsListRequest extends PageRequest {
  categoryId?: string;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly resource = `${this.baseUrl}/api/v1/products`;

  create(payload: ProductCreateDTO): Observable<ProductViewDTO> {
    return this.http.post<ProductViewDTO>(this.resource, payload);
  }

  update(id: string, payload: ProductReplaceDTO): Observable<ProductViewDTO> {
    return this.http.put<ProductViewDTO>(`${this.resource}/${encodeURIComponent(id)}`, payload);
  }

  patch(id: string, payload: ProductPatchDTO): Observable<ProductViewDTO> {
    return this.http.patch<ProductViewDTO>(`${this.resource}/${encodeURIComponent(id)}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${encodeURIComponent(id)}`);
  }

  list(params?: ProductsListRequest): Observable<PageResponse<ProductViewDTO>> {
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
    return this.http
      .get<ProductViewDTO[] | PageResponse<ProductViewDTO>>(this.resource, {
        params: httpParams,
        observe: 'response'
      })
      .pipe(map(response => this.normalizeListResponse(response, params)));
  }

  getById(id: string): Observable<ProductViewDTO> {
    return this.http.get<ProductViewDTO>(`${this.resource}/${encodeURIComponent(id)}`);
  }

  private normalizeListResponse(
    response: HttpResponse<ProductViewDTO[] | PageResponse<ProductViewDTO>>,
    params?: ProductsListRequest
  ): PageResponse<ProductViewDTO> {
    const body = response.body;
    const requestedPage = params?.page ?? 1;
    const requestedPageSize = params?.pageSize;

    if (!body) {
      const pageSize = requestedPageSize ?? 0;
      return {
        items: [],
        totalItems: 0,
        page: requestedPage,
        pageSize,
        totalPages: 0
      };
    }

    if (!Array.isArray(body)) {
      const totalItems = body.totalItems ?? body.items?.length ?? 0;
      const pageSize = body.pageSize ?? requestedPageSize ?? (body.items?.length ?? 0);
      const totalPages = body.totalPages ?? (pageSize ? Math.max(1, Math.ceil(totalItems / pageSize)) : 0);
      return {
        items: body.items ?? [],
        totalItems,
        page: body.page ?? requestedPage,
        pageSize,
        totalPages
      };
    }

    const headerTotal = Number(response.headers.get('X-Total-Count'));
    if (Number.isFinite(headerTotal) && headerTotal >= 0) {
      const pageSize = requestedPageSize ?? (body.length || 1);
      const totalPages = Math.max(1, Math.ceil(headerTotal / pageSize));
      return {
        items: body,
        totalItems: headerTotal,
        page: requestedPage,
        pageSize,
        totalPages
      };
    }

    const totalItems = body.length;
    const pageSize = requestedPageSize ?? (totalItems || 1);
    const start = (requestedPage - 1) * pageSize;
    const items = body.slice(start, start + pageSize);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      items,
      totalItems,
      page: requestedPage,
      pageSize,
      totalPages
    };
  }
}


