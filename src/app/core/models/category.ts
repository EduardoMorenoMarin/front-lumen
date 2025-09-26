/**
 * Base category shape for internal APIs.
 * Endpoint: multiple under /api/v1/categories
 */
export interface CategoryDTO {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  active: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Create category request.
 * Endpoint: POST /api/v1/categories
 */
export interface CategoryCreateDTO {
  name: string;
  slug?: string;
  description?: string;
  active?: boolean;
}

/**
 * Update category request.
 * Endpoint: PUT /api/v1/categories/:id
 */
export interface CategoryUpdateDTO {
  name?: string;
  slug?: string;
  description?: string;
  active?: boolean;
}

/**
 * Category view for admin screens.
 * Endpoint: GET /api/v1/categories, GET /api/v1/categories/:id
 */
export interface CategoryViewDTO extends CategoryDTO {
  productCount?: number;
}


