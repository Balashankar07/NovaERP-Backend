// User types — mirrors backend User DTOs exactly
// DO NOT rename or modify these fields; they match the backend API contract

export interface UserAssignedRole {
  roleId: string;
  roleName: string;
  isOperationallyReady: boolean;
  readinessReason: string;
  dashboardRoute: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyId: string;
  roleIds: string[];
  isActive: boolean;
  googleSubjectLinked: boolean;
  assignedRoles: UserAssignedRole[];
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  companyId: string;
  roleIds: string[];
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  phone: string;
  companyId: string;
  roleIds: string[];
  isActive: boolean;
  googleSubjectId?: string;
}
