import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Reservation,
  ReservationCancelRequest,
  ReservationConfirmRequest,
  ReservationCreateRequest,
  ReservationListResponse,
  ReservationStatus
} from '../models/reservation';

export interface ReservationsListParams {
  search?: string;
  status?: ReservationStatus | '';
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class ReservationsApi {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiBaseUrl}/api/v1/reservations`;

  list(params?: ReservationsListParams): Observable<ReservationListResponse> {
    const httpParams = this.buildParams(params);
    return this.http.get<ReservationListResponse>(this.resourceUrl, {
      params: httpParams
    });
  }

  get(id: string): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.resourceUrl}/${encodeURIComponent(id)}`);
  }

  create(request: ReservationCreateRequest): Observable<Reservation> {
    return this.http.post<Reservation>(this.resourceUrl, request);
  }

  cancel(id: string, request: ReservationCancelRequest): Observable<Reservation> {
    return this.http.post<Reservation>(
      `${this.resourceUrl}/${encodeURIComponent(id)}/cancel`,
      request
    );
  }

  accept(id: string): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.resourceUrl}/${encodeURIComponent(id)}/accept`, {});
  }

  confirm(id: string, request: ReservationConfirmRequest): Observable<Reservation> {
    return this.http.post<Reservation>(
      `${this.resourceUrl}/${encodeURIComponent(id)}/confirm`,
      request
    );
  }

  private buildParams(params?: ReservationsListParams): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      httpParams = httpParams.set(key, String(value));
    });
    return httpParams;
  }
}
