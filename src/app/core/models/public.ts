/**
 * Public product data visible in the storefront.
 * Endpoint: GET /public/products, GET /public/products/:id
 */
export interface PublicProductView {
  id: string;
  name: string;
  author?: string;
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
 * Endpoint: GET /public/categories, GET /public/categories/:id
 */
export interface PublicCategoryView {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
}

/**
 * Detailed contact data required when creating a reservation from the public site.
 */
export interface PublicReservationCustomerData {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
}

/**
 * Information about a product reserved from the public site.
 */
export interface PublicReservationItem {
  productId: string;
  quantity: number;
}

/**
 * Payload to create a reservation from the public site.
 * Endpoint: POST /public/reservations
 */
export interface PublicReservationCreateRequest {
  customerData: PublicReservationCustomerData;
  items: PublicReservationItem[];
  pickupDeadline: string; // ISO date string
  notes?: string;
}

/**
 * Response returned after creating a reservation on the public site.
 * Endpoint: POST /public/reservations
 */
export interface PublicReservationCreatedResponse {
  reservationId: string;
  code: string;
  status: 'pending' | 'confirmed';
  expiresAt?: string; // ISO date string
}


