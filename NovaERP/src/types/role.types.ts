// Role types — mirrors backend Role DTOs exactly
// DO NOT rename or modify these fields; they match the backend API contract

export interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
}

export interface UpdateRoleRequest {
  name: string;
  description: string;
  isActive: boolean;
}
