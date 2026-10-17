import { api } from "@/lib/api-helper";
import { PaginatedResponse, PaginationParams } from "@/types/api.types";

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityName: string;
  entityId: string;
  timestamp: string;
  details: string;
  ipAddress: string;
  oldValues?: string;
  newValues?: string;
}

export const auditLogsApi = {
  getAll: (params?: PaginationParams & { sortBy?: string, sortOrder?: string }): Promise<PaginatedResponse<AuditLog>> => 
    api.get<PaginatedResponse<AuditLog>>("/AuditLogs", { params }),

  getById: (id: string): Promise<AuditLog> => 
    api.get<AuditLog>(`/AuditLogs/${id}`),

  getByUserId: (userId: string): Promise<AuditLog[]> => 
    api.get<AuditLog[]>(`/AuditLogs/user/${userId}`),
};

