/**
 * Create sale request.
 * Endpoint: POST /api/v1/sales
 */
export interface SaleCreateDTO {
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  paymentMethod: string;
  customerId: string;
  notes?: string;
}

/**
 * Sale view (detailed).
 * Endpoint: GET /api/v1/sales/:id
 */
export interface SaleViewDTO {
  id: string;
  status: string;
  saleDate: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  notes: string | null;
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  cashierId: string;
  cashierEmail: string;
  items: Array<{
    id: string;
    productId: string;
    productTitle: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Daily sales totals for reporting.
 * Endpoint: GET /api/v1/reports/sales/daily?start=&end=
 */
export interface DailySalesTotalsDTO {
  date: string; // YYYY-MM-DD
  totalSales: number;
  totalOrders: number;
  currency: string;
}


