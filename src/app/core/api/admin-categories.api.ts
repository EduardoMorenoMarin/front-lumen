import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Category,
  CategoryCreateInput,
  CategoryPatchInput,
  CategoryUpdateInput
} from '../models/category-management';

interface RequestOptions {
  timeoutMs?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminCategoriesApi {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiBaseUrl}/api/v1/categories`;
  private readonly defaultTimeout = 10000;

  list(options?: RequestOptions): Observable<Category[]> {
    return this.http
      .get<Category[]>(this.resourceUrl)
      .pipe(timeout(options?.timeoutMs ?? this.defaultTimeout));
  }

  getById(id: string, options?: RequestOptions): Observable<Category> {
    return this.http
      .get<Category>(`${this.resourceUrl}/${encodeURIComponent(id)}`)
      .pipe(timeout(options?.timeoutMs ?? this.defaultTimeout));
  }

  create(payload: CategoryCreateInput, options?: RequestOptions): Observable<Category> {
    return this.http
      .post<Category>(this.resourceUrl, payload)
      .pipe(timeout(options?.timeoutMs ?? this.defaultTimeout));
  }

  update(id: string, payload: CategoryUpdateInput, options?: RequestOptions): Observable<Category> {
    return this.http
      .put<Category>(`${this.resourceUrl}/${encodeURIComponent(id)}`, payload)
      .pipe(timeout(options?.timeoutMs ?? this.defaultTimeout));
  }

  patch(id: string, payload: CategoryPatchInput, options?: RequestOptions): Observable<Category> {
    return this.http
      .patch<Category>(`${this.resourceUrl}/${encodeURIComponent(id)}`, payload)
      .pipe(timeout(options?.timeoutMs ?? this.defaultTimeout));
  }

  delete(id: string, options?: RequestOptions): Observable<void> {
    return this.http
      .delete<void>(`${this.resourceUrl}/${encodeURIComponent(id)}`)
      .pipe(timeout(options?.timeoutMs ?? this.defaultTimeout));
  }
}
