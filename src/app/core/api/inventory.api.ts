import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InventoryAdjustmentRequest, InventoryAdjustmentResponse, ProductStockResponse } from '../models/inventory';

@Injectable({ providedIn: 'root' })
export class InventoryApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly resource = `${this.baseUrl}/api/v1/inventory`;

  adjust(payload: InventoryAdjustmentRequest): Observable<InventoryAdjustmentResponse> {
    return this.http.post<InventoryAdjustmentResponse>(`${this.resource}/adjust`, payload);
  }

  getProductStock(productId: string): Observable<ProductStockResponse> {
    return this.http.get<ProductStockResponse>(`${this.resource}/products/${encodeURIComponent(productId)}/stock`);
  }
}


