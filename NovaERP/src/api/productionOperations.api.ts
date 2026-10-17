import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";
import { PagedResult } from "../types/common.types";
import {
  WorkCenter,
  CreateWorkCenterDto,
  UpdateWorkCenterDto,
  Machine,
  CreateMachineDto,
  UpdateMachineDto,
  MachineStatus,
  ProductionRouting,
  CreateProductionRoutingDto,
  ProductionWorkerAssignment,
  CreateWorkerAssignmentDto,
  ProductionSchedule,
  CreateProductionScheduleDto,
  UpdateScheduleStatusDto,
  ScheduleStatus,
  ProductionEvent,
  CreateProductionEventDto,
  ProductionEventType,
  ProductionOperationsSummary
} from "../types/productionOperations.types";

export const productionOperationsApi = {
  // --- STAGE A: WORK CENTERS ---
  getWorkCenters: (params?: { pageNumber?: number; pageSize?: number; search?: string }) =>
    api.get<PagedResult<WorkCenter>>(API_ENDPOINTS.PRODUCTION_OPERATIONS.WORK_CENTERS, { params }),

  createWorkCenter: (data: CreateWorkCenterDto) =>
    api.post<WorkCenter>(API_ENDPOINTS.PRODUCTION_OPERATIONS.WORK_CENTERS, data),

  updateWorkCenter: (id: string, data: UpdateWorkCenterDto) =>
    api.put<WorkCenter>(API_ENDPOINTS.PRODUCTION_OPERATIONS.WORK_CENTER_BY_ID(id), data),

  // --- STAGE B: MACHINES ---
  getMachines: (params?: { pageNumber?: number; pageSize?: number; workCenterId?: string; status?: MachineStatus }) =>
    api.get<PagedResult<Machine>>(API_ENDPOINTS.PRODUCTION_OPERATIONS.MACHINES, { params }),

  createMachine: (data: CreateMachineDto) =>
    api.post<Machine>(API_ENDPOINTS.PRODUCTION_OPERATIONS.MACHINES, data),

  updateMachine: (id: string, data: UpdateMachineDto) =>
    api.put<Machine>(API_ENDPOINTS.PRODUCTION_OPERATIONS.MACHINE_BY_ID(id), data),

  // --- STAGE C: ROUTINGS ---
  getRoutings: (params?: { pageNumber?: number; pageSize?: number; productId?: string }) =>
    api.get<PagedResult<ProductionRouting>>(API_ENDPOINTS.PRODUCTION_OPERATIONS.ROUTINGS, { params }),

  createRouting: (data: CreateProductionRoutingDto) =>
    api.post<ProductionRouting>(API_ENDPOINTS.PRODUCTION_OPERATIONS.ROUTINGS, data),

  getRoutingByProduct: (productId: string) =>
    api.get<ProductionRouting | null>(API_ENDPOINTS.PRODUCTION_OPERATIONS.ROUTING_BY_PRODUCT(productId)),

  // --- STAGE D: WORKER ASSIGNMENTS ---
  getWorkerAssignments: (params?: { pageNumber?: number; pageSize?: number; executionId?: string; employeeId?: string }) =>
    api.get<PagedResult<ProductionWorkerAssignment>>(API_ENDPOINTS.PRODUCTION_OPERATIONS.ASSIGNMENTS, { params }),

  assignWorker: (data: CreateWorkerAssignmentDto) =>
    api.post<ProductionWorkerAssignment>(API_ENDPOINTS.PRODUCTION_OPERATIONS.ASSIGNMENTS, data),

  completeWorkerAssignment: (id: string) =>
    api.put<ProductionWorkerAssignment>(API_ENDPOINTS.PRODUCTION_OPERATIONS.ASSIGNMENT_COMPLETE(id)),

  // --- STAGE E: SCHEDULING ---
  getSchedules: (params?: { pageNumber?: number; pageSize?: number; productionOrderId?: string; workCenterId?: string; status?: ScheduleStatus }) =>
    api.get<PagedResult<ProductionSchedule>>(API_ENDPOINTS.PRODUCTION_OPERATIONS.SCHEDULES, { params }),

  createSchedule: (data: CreateProductionScheduleDto) =>
    api.post<ProductionSchedule>(API_ENDPOINTS.PRODUCTION_OPERATIONS.SCHEDULES, data),

  updateScheduleStatus: (id: string, data: UpdateScheduleStatusDto) =>
    api.put<ProductionSchedule>(API_ENDPOINTS.PRODUCTION_OPERATIONS.SCHEDULE_STATUS(id), data),

  // --- STAGE G: DOWNTIME / PRODUCTION EVENTS ---
  getEvents: (params?: { pageNumber?: number; pageSize?: number; executionId?: string; machineId?: string; eventType?: ProductionEventType }) =>
    api.get<PagedResult<ProductionEvent>>(API_ENDPOINTS.PRODUCTION_OPERATIONS.EVENTS, { params }),

  createEvent: (data: CreateProductionEventDto) =>
    api.post<ProductionEvent>(API_ENDPOINTS.PRODUCTION_OPERATIONS.EVENTS, data),

  // --- STAGE H: REPORTS SUMMARY ---
  getSummaryReport: () =>
    api.get<ProductionOperationsSummary>(API_ENDPOINTS.PRODUCTION_OPERATIONS.REPORTS_SUMMARY),
};
