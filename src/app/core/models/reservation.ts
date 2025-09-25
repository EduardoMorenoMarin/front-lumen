/**
 * Reservation base entity.
 * Endpoint: multiple under /api/v1/reservations
 */
export interface ReservationItemDTO {
  id: string;
  productId: string;
  productTitle?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface ReservationDTO {
  id: string;
  code: string;
  status: string;
  /**
   * Fecha en la que se creó la reserva.
   */
  reservationDate?: string; // ISO date string
  /**
   * Equivalente anterior para compatibilidad.
   */
  reservedAt?: string; // ISO date string
  desiredPickupDate?: string; // ISO date string
  pickupDeadline?: string; // ISO date string
  pickedUpAt?: string; // ISO date string
  cancelledAt?: string; // ISO date string
  notes?: string;
  /**
   * Información del producto reservada en versiones anteriores.
   */
  productId?: string;
  productName?: string;
  /**
   * Información de cliente y totales expuestos por la API actual.
   */
  customerId?: string;
  customerName?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerDni?: string;
  quantity?: number;
  totalAmount?: number;
  items?: ReservationItemDTO[];
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

/**
 * View returned for management screens.
 * Endpoint: GET /api/v1/reservations, GET /api/v1/reservations/:id
 */
export interface ReservationViewDTO extends ReservationDTO {}

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


