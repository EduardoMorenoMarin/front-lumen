/**
 * Base product shape for internal APIs.
 * Endpoint: multiple under /api/v1/products
 */
export interface ProductDTO {
  id: string;
  sku: string;
  isbn?: string;
  title: string;
  author?: string;
  description?: string;
  price: number;
  active: boolean;
  categoryId: string;
  categoryName?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  currency?: string; // permitido por compatibilidad hacia atrás
}

/**
 * Create product request.
 * Endpoint: POST /api/v1/products
 */
export interface ProductCreateDTO {
  sku: string;
  isbn?: string;
  title: string;
  author: string;
  description: string;
  price: number;
  active: boolean;
  categoryId: string;
}

/**
 * Replace product request (PUT)
 */
export interface ProductReplaceDTO extends ProductCreateDTO {
  id: string;
}

/**
 * Partial update payload (PATCH)
 */
export interface ProductPatchDTO {
  id?: string;
  sku?: string;
  isbn?: string | null;
  title?: string;
  author?: string;
  description?: string;
  price?: number;
  active?: boolean;
  categoryId?: string;
}

/**
 * Product view for admin screens.
 */
export type ProductViewDTO = ProductDTO;


