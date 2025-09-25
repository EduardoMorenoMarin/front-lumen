/**
 * Public product data visible in the storefront.
 * Endpoint: GET /api/v1/public/products, GET /api/v1/public/products/:id
 */
export interface PublicProductView {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  categoryId: string;
  categoryName?: string;
  imageUrl?: string;
  availableStock?: number;
}

/**
 * Public category data visible in the storefront.
 * Endpoint: GET /api/v1/public/categories, GET /api/v1/public/categories/:id
 */
export interface PublicCategoryView {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
}

/**
 * Payload to create a reservation from the public site.
 * Endpoint: POST /api/v1/public/reservations
 */
export interface PublicReservationCreateRequest {
  productId: string;
  quantity: number;
  desiredPickupDate?: string; // ISO date string
  customerDocument?: string; // e.g. DNI
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
}

/**
 * Response returned after creating a reservation on the public site.
 * Endpoint: POST /api/v1/public/reservations
 */
export interface PublicReservationCreatedResponse {
  reservationId: string;
  code: string;
  status: 'pending' | 'confirmed';
  expiresAt?: string; // ISO date string
}


