import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";
import { PaginatedResponse, PaginationParams } from "@/types/api.types";
import { SupplierProductDto, CreateSupplierProductDto, UpdateSupplierProductDto } from "@/types/suppliers.types";

export const supplierProductsApi = {
  getAll: (params?: PaginationParams & { supplierId?: string, productId?: string, isActive?: boolean }) => 
    api.get<PaginatedResponse<SupplierProductDto>>(API_ENDPOINTS.SUPPLIER_PRODUCTS.BASE, { params }),

  getById: (id: string) => 
    api.get<SupplierProductDto>(API_ENDPOINTS.SUPPLIER_PRODUCTS.BY_ID(id)),

  getBySupplier: (supplierId: string) => 
    api.get<SupplierProductDto[]>(API_ENDPOINTS.SUPPLIER_PRODUCTS.BY_SUPPLIER(supplierId)),

  getBySupplierId: (supplierId: string) => 
    api.get<SupplierProductDto[]>(API_ENDPOINTS.SUPPLIER_PRODUCTS.BY_SUPPLIER(supplierId)),

  getByProduct: (productId: string) => 
    api.get<SupplierProductDto[]>(API_ENDPOINTS.SUPPLIER_PRODUCTS.BY_PRODUCT(productId)),

  create: (data: CreateSupplierProductDto) => 
    api.post<SupplierProductDto>(API_ENDPOINTS.SUPPLIER_PRODUCTS.BASE, data),

  update: (id: string, data: UpdateSupplierProductDto) => 
    api.put<SupplierProductDto>(API_ENDPOINTS.SUPPLIER_PRODUCTS.BY_ID(id), data),

  delete: (id: string) => 
    api.delete(API_ENDPOINTS.SUPPLIER_PRODUCTS.BY_ID(id)),
};
