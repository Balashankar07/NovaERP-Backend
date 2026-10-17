// Auth types — mirrors backend Authentication DTOs exactly
// DO NOT rename or modify these fields; they match the backend API contract

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  userName: string;
  role: string;
}

export interface GoogleSignInRequest {
  credential: string; // Google ID token (JWT) from @react-oauth/google's GoogleLogin component
}

export interface LinkGoogleRequest {
  credential: string; // Google ID token (JWT) from @react-oauth/google's GoogleLogin component
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CurrentUser {
  isAuthenticated: boolean;
  userId: string;
  email: string;
  role: string;
  companyId: string;
  branchId: string;
  permissions: string[];
}

// User roles as defined in the backend
export type UserRole =
  | "Administrator"
  | "Procurement Manager"
  | "Production Manager"
  | "Warehouse Manager"
  | "Quality Engineer"
  | "Sales Manager"
  | "Warranty Executive";
