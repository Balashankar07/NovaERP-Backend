// Company types — mirrors backend Company DTOs exactly
// DO NOT rename or modify these fields; they match the backend API contract

export interface Company {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  website: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  logoUrl: string | null;
  isActive: boolean;
}

export interface CreateCompanyRequest {
  name: string;
  code: string;
  email: string;
  phone: string;
  website?: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  logoUrl?: string | null;
}

export interface UpdateCompanyRequest {
  name: string;
  email: string;
  phone: string;
  website?: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  logoUrl?: string | null;
  isActive: boolean;
}
