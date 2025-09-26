/**
 * Customer with DNI for internal APIs.
 * Endpoint: multiple under /api/v1/customers
 */
export interface CustomerDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dni: string; // Documento Nacional de Identidad
  notes: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Create customer request.
 * Endpoint: POST /api/v1/customers
 */
export interface CustomerCreateDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dni: string;
  notes: string;
}

/**
 * Replace customer request.
 * Endpoint: PUT /api/v1/customers/:id
 */
export interface CustomerPutDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dni: string;
  notes: string;
}

/**
 * Partial update customer request.
 * Endpoint: PATCH /api/v1/customers/:id
 */
export interface CustomerPatchDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dni?: string;
  notes?: string;
}

/**
 * Customer view for admin screens.
 * Endpoint: GET /api/v1/customers, GET /api/v1/customers/:id
 */
export interface CustomerViewDTO extends CustomerDTO {}

