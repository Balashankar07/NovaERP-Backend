import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";
import { PaginatedResponse, PaginationParams } from "@/types/api.types";
import { ProductDto, CreateProductDto, UpdateProductDto, ProductType } from "@/types/products.types";

export const productsApi = {
  getAll: (params?: PaginationParams & { sortBy?: string, sortOrder?: string, productType?: ProductType | string }) => 
    api.get<PaginatedResponse<ProductDto>>(API_ENDPOINTS.PRODUCTS.BASE, { params }),

  getById: (id: string) => 
    api.get<ProductDto>(API_ENDPOINTS.PRODUCTS.BY_ID(id)),

  create: (data: CreateProductDto) => 
    api.post<ProductDto>(API_ENDPOINTS.PRODUCTS.BASE, data),

  update: (id: string, data: UpdateProductDto) => 
    api.put<ProductDto>(API_ENDPOINTS.PRODUCTS.BY_ID(id), data),

  delete: (id: string) => 
    api.delete<boolean>(API_ENDPOINTS.PRODUCTS.BY_ID(id)),

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<{ url: string }>(`${API_ENDPOINTS.PRODUCTS.BASE}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
