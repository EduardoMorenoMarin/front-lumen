/**
 * Inventory adjustment record.
 * Endpoint: GET/POST /api/v1/inventory/adjustments
 */
export interface InventoryAdjustmentResponse {
  id: string;
  productId: string;
  change: number; // positive or negative
  reason?: string;
  createdBy: string; // userId
  createdAt: string; // ISO date string
}

/**
 * Create inventory adjustment request.
 * Endpoint: POST /api/v1/inventory/adjustments
 */
export interface InventoryAdjustmentRequest {
  productId: string;
  change: number;
  reason?: string;
}

/**
 * Current stock response for a product.
 * Endpoint: GET /api/v1/inventory/products/:id/stock
 */
export interface ProductStockResponse {
  productId: string;
  stock: number;
  updatedAt: string; // ISO date string
}


