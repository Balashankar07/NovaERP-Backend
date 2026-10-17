import { api } from "@/lib/api-helper";
import { PagedResult } from '../types/common.types';

export interface DistributorDto {
  id: string;
  distributorNumber: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  isActive: boolean;
}

export interface CreateDistributorDto {
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
}

export const distributorsApi = {
  getDistributors: (params?: { pageNumber?: number; pageSize?: number; search?: string; sortBy?: string; sortOrder?: string }) =>
    api.get<PagedResult<DistributorDto>>('/Distributors', { params }),
  createDistributor: (data: CreateDistributorDto) =>
    api.post<DistributorDto>('/Distributors', data),
};
