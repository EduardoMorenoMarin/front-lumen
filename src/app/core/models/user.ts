/**
 * User entity for internal management.
 * Endpoint: GET /api/v1/users, GET /api/v1/users/:id
 */
export interface UserDTO {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  status: 'active' | 'inactive';
  createdAt: string; // ISO date string
}

/**
 * Create user request.
 * Endpoint: POST /api/v1/users
 */
export interface UserCreateDTO {
  username: string;
  password: string;
  email?: string;
  roles?: string[];
}

/**
 * Update user status request.
 * Endpoint: PUT /api/v1/users/:id/status
 */
export interface UserStatusUpdateDTO {
  status: 'active' | 'inactive';
}


