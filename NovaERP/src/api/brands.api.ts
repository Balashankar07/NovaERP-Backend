import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";
import { BrandDto, CreateBrandDto, UpdateBrandDto } from "@/types/brands.types";
import { PaginatedResponse, PaginationParams } from "@/types/api.types";

export const brandsApi = {
  /**
   * Retrieves a paginated list of brands based on search, sorting, and pagination parameters.
   */
  getAll: (params?: PaginationParams) => 
    api.get<PaginatedResponse<BrandDto>>(API_ENDPOINTS.BRANDS.BASE, { params }),

  /**
   * Retrieves a single brand by its unique identifier.
   */
  getById: (id: string) => 
    api.get<BrandDto>(API_ENDPOINTS.BRANDS.BY_ID(id)),

  /**
   * Creates a new brand.
   */
  create: (data: CreateBrandDto) => 
    api.post<BrandDto>(API_ENDPOINTS.BRANDS.BASE, data),

  /**
   * Updates an existing brand by its unique identifier.
   */
  update: (id: string, data: UpdateBrandDto) => 
    api.put<BrandDto>(API_ENDPOINTS.BRANDS.BY_ID(id), data),

  /**
   * Deletes a brand by its unique identifier.
   */
  delete: (id: string) => 
    api.delete<boolean>(API_ENDPOINTS.BRANDS.BY_ID(id)),
};
