/**
 * Payload for user login.
 * Endpoint: POST /api/v1/auth/login
 */
export interface AuthLoginRequest {
  email: string;
  password: string;
}

/**
 * Response after successful login.
 * Endpoint: POST /api/v1/auth/login
 */
export interface AuthLoginResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: 'Bearer';
  expiresIn?: number; // seconds
}

/**
 * Authenticated user profile.
 * Endpoint: GET /api/v1/auth/me
 */
export interface MeResponse {
  id: string;
  email: string;
  roles: string[];
  displayName?: string;
}


