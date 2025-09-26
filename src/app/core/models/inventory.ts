/**
 * Inventory adjustment record.
 * Endpoint: POST /api/v1/inventory/adjust
 */
export interface InventoryAdjustmentResponse {
  productId: string;
  stock: number;
  adjustedAt: string; // ISO date string
}

/**
 * Create inventory adjustment request.
 * Endpoint: POST /api/v1/inventory/adjust
 */
export interface InventoryAdjustmentRequest {
  productId: string;
  delta: number;
  reason?: string;
}

/**
 * Current stock response for a product.
 * Endpoint: GET /api/v1/inventory/products/:id/stock
 */
export interface ProductStockResponse {
  productId: string;
  stock: number;
  adjustedAt: string; // ISO date string
}


