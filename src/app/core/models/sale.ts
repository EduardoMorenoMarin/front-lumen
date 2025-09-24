/**
 * Sale record.
 * Endpoint: GET/POST /api/v1/sales
 */
export interface SaleDTO {
  id: string;
  reservationId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    currency: string;
  }>;
  total: number;
  currency: string;
  createdAt: string; // ISO date string
  createdBy: string; // userId
}

/**
 * Create sale request.
 * Endpoint: POST /api/v1/sales
 */
export interface SaleCreateDTO {
  reservationId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    currency: string;
  }>;
}

/**
 * Sale view (detailed).
 * Endpoint: GET /api/v1/sales/:id
 */
export interface SaleViewDTO extends SaleDTO {}

/**
 * Daily sales totals for reporting.
 * Endpoint: GET /api/v1/reports/daily-sales?date=YYYY-MM-DD
 */
export interface DailySalesTotalsDTO {
  date: string; // YYYY-MM-DD
  totalSales: number;
  totalOrders: number;
  currency: string;
}


