import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "@/api/endpoints";
import type {
  Company,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from "@/types";

/**
 * Company API service — consumes backend Company endpoints.
 */
export const companyApi = {
  /**
   * GET /api/Company
   */
  getAll: (): Promise<Company[]> => 
    api.get<Company[]>(API_ENDPOINTS.COMPANY.BASE),

  /**
   * GET /api/Company/{id}
   */
  getById: (id: string): Promise<Company> => 
    api.get<Company>(API_ENDPOINTS.COMPANY.BY_ID(id)),

  /**
   * POST /api/Company
   */
  create: (data: CreateCompanyRequest): Promise<Company> => 
    api.post<Company>(API_ENDPOINTS.COMPANY.BASE, data),

  /**
   * PUT /api/Company/{id}
   */
  update: (id: string, data: UpdateCompanyRequest): Promise<Company> => 
    api.put<Company>(API_ENDPOINTS.COMPANY.BY_ID(id), data),

  /**
   * DELETE /api/Company/{id}
   */
  delete: (id: string): Promise<void> => 
    api.delete<void>(API_ENDPOINTS.COMPANY.BY_ID(id)),
};
