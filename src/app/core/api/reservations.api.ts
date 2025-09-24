import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReservationCancelRequest, ReservationCreateDTO, ReservationPickupRequest, ReservationViewDTO } from '../models/reservation';

@Injectable({ providedIn: 'root' })
export class ReservationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly resource = `${this.baseUrl}/api/v1/reservations`;

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
}


