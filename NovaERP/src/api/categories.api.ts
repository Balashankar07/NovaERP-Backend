import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from "@/types/categories.types";
import { PaginatedResponse, PaginationParams } from "@/types/api.types";

export const categoriesApi = {
  /**
   * Retrieves a paginated list of categories based on search, sorting, and pagination parameters.
   */
  getAll: (params: PaginationParams & { sortBy?: string, sortOrder?: string }) => 
    api.get<PaginatedResponse<CategoryDto>>(API_ENDPOINTS.CATEGORIES.BASE, { params }),

  /**
   * Retrieves a single category by its unique identifier.
   */
  getById: (id: string) => 
    api.get<CategoryDto>(API_ENDPOINTS.CATEGORIES.BY_ID(id)),

  /**
   * Creates a new category.
   */
  create: (data: CreateCategoryDto) => 
    api.post<CategoryDto>(API_ENDPOINTS.CATEGORIES.BASE, data),

  /**
   * Updates an existing category by its unique identifier.
   */
  update: (id: string, data: UpdateCategoryDto) => 
    api.put<CategoryDto>(API_ENDPOINTS.CATEGORIES.BY_ID(id), data),

  /**
   * Deletes a category by its unique identifier.
   */
  delete: (id: string) => 
    api.delete<boolean>(API_ENDPOINTS.CATEGORIES.BY_ID(id)),
};
