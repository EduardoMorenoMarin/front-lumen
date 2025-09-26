import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PublicCategoryView } from '../models/public';

@Injectable({ providedIn: 'root' })
export class PublicCategoriesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly resource = `${this.baseUrl}/public/categories`;
  private readonly requestTimeoutMs = 10000;

  list(): Observable<PublicCategoryView[]> {
    return this.http.get<PublicCategoryView[]>(this.resource).pipe(timeout(this.requestTimeoutMs));

  }

  getById(id: string): Observable<PublicCategoryView> {
    return this.http
      .get<PublicCategoryView>(`${this.resource}/${encodeURIComponent(id)}`)
      .pipe(timeout(this.requestTimeoutMs));
  }
}


