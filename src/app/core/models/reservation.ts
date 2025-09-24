/**
 * Reservation base entity.
 * Endpoint: multiple under /api/v1/reservations
 */
export interface ReservationDTO {
  id: string;
  code: string;
  productId: string;
  customerId: string;
  quantity: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'picked_up';
  reservedAt: string; // ISO date string
  desiredPickupDate?: string; // ISO date string
  pickedUpAt?: string; // ISO date string
  cancelledAt?: string; // ISO date string
  notes?: string;
}

/**
 * View returned for management screens.
 * Endpoint: GET /api/v1/reservations, GET /api/v1/reservations/:id
 */
export interface ReservationViewDTO extends ReservationDTO {
  productName?: string;
  customerName?: string;
}

/**
 * Create reservation request.
 * Endpoint: POST /api/v1/reservations
 */
export interface ReservationCreateDTO {
  productId: string;
  customerId: string;
  quantity: number;
  desiredPickupDate?: string; // ISO date string
  notes?: string;
}

/**
 * Cancel reservation request.
 * Endpoint: POST /api/v1/reservations/:id/cancel
 */
export interface ReservationCancelRequest {
  reason?: string;
}

/**
 * Pickup reservation request.
 * Endpoint: POST /api/v1/reservations/:id/pickup
 */
export interface ReservationPickupRequest {
  pickedUpAt?: string; // ISO date string
}


