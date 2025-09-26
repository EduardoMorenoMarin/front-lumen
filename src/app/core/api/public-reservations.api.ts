import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PublicReservationCreateRequest, PublicReservationCreatedResponse } from '../models/public';

@Injectable({ providedIn: 'root' })
export class PublicReservationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly resource = `${this.baseUrl}/public/reservations`;

  create(request: PublicReservationCreateRequest): Observable<PublicReservationCreatedResponse> {
    return this.http.post<PublicReservationCreatedResponse>(this.resource, request);
  }
}


