import { api } from "@/lib/api-helper";
import { PagedResult } from '../types/common.types';

export interface DistributorDto {
  id: string;
  distributorNumber?: string;
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

export interface UpdateDistributorDto {
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  isActive: boolean;
}

export const distributorsApi = {
  getDistributors: (params?: { pageNumber?: number; pageSize?: number; search?: string; sortBy?: string; sortOrder?: string }) =>
    api.get<PagedResult<DistributorDto>>('/Distributors', { params }),

  getDistributorById: (id: string) =>
    api.get<DistributorDto>(`/Distributors/${id}`),

  createDistributor: (data: CreateDistributorDto) =>
    api.post<DistributorDto>('/Distributors', data),

  updateDistributor: (id: string, data: UpdateDistributorDto) =>
    api.put<DistributorDto>(`/Distributors/${id}`, data),

  toggleDistributorStatus: (id: string) =>
    api.patch<void>(`/Distributors/${id}/toggle-status`),

  deleteDistributor: (id: string) =>
    api.delete<void>(`/Distributors/${id}`),
};
