/**
 * Base product shape for internal APIs.
 * Endpoint: multiple under /api/v1/products
 */
export interface ProductDTO {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  currency: string;
  categoryId: string;
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Create product request.
 * Endpoint: POST /api/v1/products
 */
export interface ProductCreateDTO {
  name: string;
  description?: string;
  sku: string;
  price: number;
  currency: string;
  categoryId: string;
  isActive?: boolean;
}

/**
 * Update product request.
 * Endpoint: PUT /api/v1/products/:id
 */
export interface ProductUpdateDTO {
  name?: string;
  description?: string;
  sku?: string;
  price?: number;
  currency?: string;
  categoryId?: string;
  isActive?: boolean;
}

/**
 * Product view for admin screens.
 * Endpoint: GET /api/v1/products, GET /api/v1/products/:id
 */
export interface ProductViewDTO extends ProductDTO {
  categoryName?: string;
}


