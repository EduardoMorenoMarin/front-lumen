import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PageRequest, PageResponse } from '../models/pagination';
import {
  ReservationCancelRequest,
  ReservationCreateDTO,
  ReservationPickupRequest,
  ReservationViewDTO
} from '../models/reservation';

@Injectable({ providedIn: 'root' })
export class ReservationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly resource = `${this.baseUrl}/api/v1/reservations`;

  list(params?: PageRequest & { status?: string }): Observable<PageResponse<ReservationViewDTO>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http
      .get<ReservationsListResponse>(this.resource, { params: httpParams })
      .pipe(map(response => this.normalizeListResponse(response, params)));
  }

  create(payload: ReservationCreateDTO): Observable<ReservationViewDTO> {
    return this.http.post<ReservationViewDTO>(this.resource, payload);
  }

  getById(id: string): Observable<ReservationViewDTO> {
    return this.http.get<ReservationViewDTO>(`${this.resource}/${encodeURIComponent(id)}`);
  }

  accept(id: string): Observable<ReservationViewDTO> {
    return this.http.post<ReservationViewDTO>(`${this.resource}/${encodeURIComponent(id)}/accept`, {});
  }

  confirm(id: string, createSale?: boolean): Observable<ReservationViewDTO> {
    let params = new HttpParams();
    if (createSale !== undefined) {
      params = params.set('createSale', String(createSale));
    }
    return this.http.post<ReservationViewDTO>(`${this.resource}/${encodeURIComponent(id)}/confirm`, {}, { params });
  }

  cancel(id: string, payload: ReservationCancelRequest = {}): Observable<ReservationViewDTO> {
    return this.http.post<ReservationViewDTO>(`${this.resource}/${encodeURIComponent(id)}/cancel`, payload);
  }

  pickup(id: string, payload: ReservationPickupRequest = {}): Observable<ReservationViewDTO> {
    return this.http.post<ReservationViewDTO>(`${this.resource}/${encodeURIComponent(id)}/pickup`, payload);
  }

  private normalizeListResponse(
    response: ReservationsListResponse,
    params?: PageRequest & { status?: string }
  ): PageResponse<ReservationViewDTO> {
    if (Array.isArray(response)) {
      const totalItems = response.length;
      const page = resolveMetaNumber(params?.page, 1);
      const pageSize = resolveMetaPageSize(totalItems, params?.pageSize);
      return {
        items: response,
        totalItems,
        page,
        pageSize,
        totalPages: calculateTotalPages(totalItems, pageSize)
      };
    }

    if (isPageResponse<ReservationViewDTO>(response)) {
      return response;
    }

    if (isEnvelope(response)) {
      const meta = response.meta ?? response;
      const items = response.data;
      const totalItems = resolveMetaNumber(meta.totalItems, items.length);
      const page = resolveMetaNumber(meta.page, resolveMetaNumber(params?.page, 1));
      const pageSize = resolveMetaPageSize(
        totalItems,
        resolveMetaNumber(meta.pageSize, params?.pageSize ?? 0)
      );
      const totalPages = resolveMetaNumber(
        meta.totalPages,
        calculateTotalPages(totalItems, pageSize)
      );

      return {
        items,
        totalItems,
        page,
        pageSize,
        totalPages
      };
    }

    const fallbackPage = resolveMetaNumber(params?.page, 1);
    const fallbackPageSize = resolveMetaNumber(params?.pageSize, 0);

    return {
      items: [],
      totalItems: 0,
      page: fallbackPage,
      pageSize: fallbackPageSize,
      totalPages: 0
    };
  }
}

type ReservationsListResponse =
  | PageResponse<ReservationViewDTO>
  | ReservationViewDTO[]
  | ReservationsListEnvelope;

type ReservationsListEnvelope = {
  data: ReservationViewDTO[];
  totalItems?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  meta?: {
    totalItems?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
};

function isPageResponse<T>(value: unknown): value is PageResponse<T> {
  return !!value && typeof value === 'object' && Array.isArray((value as PageResponse<T>).items);
}

function isEnvelope(value: unknown): value is ReservationsListEnvelope {
  return !!value && typeof value === 'object' && Array.isArray((value as ReservationsListEnvelope).data);
}

function resolveMetaNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
}

function resolveMetaPageSize(totalItems: number, requestedPageSize?: number): number {
  if (requestedPageSize && requestedPageSize > 0) {
    return requestedPageSize;
  }
  return totalItems > 0 ? totalItems : 0;
}

function calculateTotalPages(totalItems: number, pageSize: number): number {
  if (!pageSize) {
    return totalItems > 0 ? 1 : 0;
  }
  return Math.max(1, Math.ceil(totalItems / pageSize));
}


