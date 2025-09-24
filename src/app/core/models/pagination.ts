/**
 * Parámetros de paginación y filtros comunes.
 * Usar como query params en listados.
 */
export interface PageRequest {
  page?: number; // 1-based
  pageSize?: number; // items por página
  search?: string;
  sort?: string; // ej: "name,asc" | "price,desc"
  [key: string]: unknown; // permitir filtros adicionales (categoryId, etc.)
}

/**
 * Respuesta paginada estándar.
 */
export interface PageResponse<T> {
  items: T[];
  totalItems: number;
  page: number; // 1-based
  pageSize: number;
  totalPages: number;
}


