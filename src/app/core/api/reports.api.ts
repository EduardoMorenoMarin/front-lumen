import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DailySalesTotalsDTO } from '../models/sale';

@Injectable({ providedIn: 'root' })
export class ReportsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly resource = `${this.baseUrl}/api/v1/reports`;

  dailySales(start: string, end: string): Observable<DailySalesTotalsDTO[]> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<DailySalesTotalsDTO[]>(`${this.resource}/sales/daily`, { params });
  }

  weeklySales(start: string, end: string): Observable<DailySalesTotalsDTO[]> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<DailySalesTotalsDTO[]>(`${this.resource}/sales/weekly`, { params });
  }
}


