import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";
import { UnitDto, CreateUnitDto, UpdateUnitDto } from "@/types/units.types";
import { PaginatedResponse, PaginationParams } from "@/types/api.types";

export const unitsApi = {
  /**
   * Retrieves a paginated list of units based on search, sorting, and pagination parameters.
   */
  getAll: (params: PaginationParams & { sortBy?: string, sortOrder?: string }) => 
    api.get<PaginatedResponse<UnitDto>>(API_ENDPOINTS.UNITS.BASE, { params }),

  /**
   * Retrieves a single unit by its unique identifier.
   */
  getById: (id: string) => 
    api.get<UnitDto>(API_ENDPOINTS.UNITS.BY_ID(id)),

  /**
   * Creates a new unit.
   */
  create: (data: CreateUnitDto) => 
    api.post<UnitDto>(API_ENDPOINTS.UNITS.BASE, data),

  /**
   * Updates an existing unit by its unique identifier.
   */
  update: (id: string, data: UpdateUnitDto) => 
    api.put<UnitDto>(API_ENDPOINTS.UNITS.BY_ID(id), data),

  /**
   * Deletes a unit by its unique identifier.
   */
  delete: (id: string) => 
    api.delete<boolean>(API_ENDPOINTS.UNITS.BY_ID(id)),
};
