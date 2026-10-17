import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";
import { PaginatedResponse, PaginationParams } from "@/types/api.types";
import { 
  ProductionPlanDto, 
  CreateProductionPlanDto, 
  UpdateProductionPlanDto,
  MaterialRequirementDto,
  ProductionOrderDto,
  CreateProductionOrderDto,
  UpdateProductionOrderDto,
  StartProductionOrderRequest,
  CompleteProductionOrderRequest,
  CancelProductionOrderRequest,
  ProductionExecutionDto,
  CreateProductionExecutionDto,
  UpdateProductionExecutionDto,
  CompleteProductionExecutionDto,
  ProductionSummaryDto
} from "@/types/production.types";

export const productionApi = {
  getAllPlans: (params?: PaginationParams & { sortBy?: string, sortOrder?: string }) => 
    api.get<PaginatedResponse<ProductionPlanDto>>(API_ENDPOINTS.PRODUCTION_PLANS.BASE, { params }),

  getPlanById: (id: string) => 
    api.get<ProductionPlanDto>(API_ENDPOINTS.PRODUCTION_PLANS.BY_ID(id)),

  getPlanRequirements: (id: string) => 
    api.get<MaterialRequirementDto[]>(API_ENDPOINTS.PRODUCTION_PLANS.REQUIREMENTS(id)),

  createPlan: (data: CreateProductionPlanDto) => 
    api.post<ProductionPlanDto>(API_ENDPOINTS.PRODUCTION_PLANS.BASE, data),

  updatePlan: (id: string, data: UpdateProductionPlanDto) => 
    api.put<ProductionPlanDto>(API_ENDPOINTS.PRODUCTION_PLANS.BY_ID(id), data),

  deletePlan: (id: string) => 
    api.delete<boolean>(API_ENDPOINTS.PRODUCTION_PLANS.BY_ID(id)),

  releasePlan: (id: string) => 
    api.post<ProductionPlanDto>(API_ENDPOINTS.PRODUCTION_PLANS.RELEASE(id)),

  generatePr: (id: string) => 
    api.post<any>(API_ENDPOINTS.PRODUCTION_PLANS.GENERATE_PR(id)),

  // ==========================================
  // PRODUCTION ORDERS
  // ==========================================
  
  getAllOrders: (params?: PaginationParams & { sortBy?: string, sortOrder?: string }) => 
    api.get<PaginatedResponse<ProductionOrderDto>>(API_ENDPOINTS.PRODUCTION_ORDERS.BASE, { params }),

  getOrderById: (id: string) => 
    api.get<ProductionOrderDto>(API_ENDPOINTS.PRODUCTION_ORDERS.BY_ID(id)),

  createOrder: (data: CreateProductionOrderDto) => 
    api.post<ProductionOrderDto>(API_ENDPOINTS.PRODUCTION_ORDERS.BASE, data),

  updateOrder: (id: string, data: UpdateProductionOrderDto) => 
    api.put<ProductionOrderDto>(API_ENDPOINTS.PRODUCTION_ORDERS.BY_ID(id), data),

  deleteOrder: (id: string) => 
    api.delete<boolean>(API_ENDPOINTS.PRODUCTION_ORDERS.BY_ID(id)),

  releaseOrder: (id: string) => 
    api.post<ProductionOrderDto>(API_ENDPOINTS.PRODUCTION_ORDERS.RELEASE(id)),

  startOrder: (id: string, data: StartProductionOrderRequest) => 
    api.post<ProductionOrderDto>(API_ENDPOINTS.PRODUCTION_ORDERS.START(id), data),

  completeOrder: (id: string, data: CompleteProductionOrderRequest) => 
    api.post<ProductionOrderDto>(API_ENDPOINTS.PRODUCTION_ORDERS.COMPLETE(id), data),

  cancelOrder: (id: string, data: CancelProductionOrderRequest) => 
    api.post<ProductionOrderDto>(API_ENDPOINTS.PRODUCTION_ORDERS.CANCEL(id), data),

  // ==========================================
  // PRODUCTION EXECUTIONS
  // ==========================================
  
  getAllExecutions: (params?: PaginationParams & { sortBy?: string, sortOrder?: string }) => 
    api.get<PaginatedResponse<ProductionExecutionDto>>(API_ENDPOINTS.PRODUCTION_EXECUTIONS.BASE, { params }),

  getExecutionById: (id: string) => 
    api.get<ProductionExecutionDto>(API_ENDPOINTS.PRODUCTION_EXECUTIONS.BY_ID(id)),

  createExecution: (data: CreateProductionExecutionDto) => 
    api.post<ProductionExecutionDto>(API_ENDPOINTS.PRODUCTION_EXECUTIONS.BASE, data),

  updateExecution: (id: string, data: UpdateProductionExecutionDto) => 
    api.put<ProductionExecutionDto>(API_ENDPOINTS.PRODUCTION_EXECUTIONS.BY_ID(id), data),

  deleteExecution: (id: string) => 
    api.delete<boolean>(API_ENDPOINTS.PRODUCTION_EXECUTIONS.BY_ID(id)),

  startExecution: (id: string) => 
    api.post<ProductionExecutionDto>(API_ENDPOINTS.PRODUCTION_EXECUTIONS.START(id)),

  consumeMaterials: (id: string) => 
    api.post<ProductionExecutionDto>(API_ENDPOINTS.PRODUCTION_EXECUTIONS.CONSUME(id)),

  completeExecution: (id: string, data: CompleteProductionExecutionDto) => 
    api.post<ProductionExecutionDto>(API_ENDPOINTS.PRODUCTION_EXECUTIONS.COMPLETE(id), data),

  cancelExecution: (id: string, data: { reason: string }) => 
    api.post<ProductionExecutionDto>(API_ENDPOINTS.PRODUCTION_EXECUTIONS.CANCEL(id), data),

  getSummary: () =>
    api.get<ProductionSummaryDto>(API_ENDPOINTS.REPORTS.PRODUCTION_SUMMARY),
};

export const productionPlansApi = {
  getAll: (params?: any) => productionApi.getAllPlans(params),
  getById: (id: string) => productionApi.getPlanById(id),
  create: (data: any) => productionApi.createPlan(data),
  update: (id: string, data: any) => productionApi.updatePlan(id, data),
  delete: (id: string) => productionApi.deletePlan(id),
  release: (id: string) => productionApi.releasePlan(id),
  getRequirements: (id: string) => productionApi.getPlanRequirements(id),
  generatePr: (id: string) => productionApi.generatePr(id),
};

export const productionOrdersApi = {
  getAll: (params?: any) => productionApi.getAllOrders(params),
  getById: (id: string) => productionApi.getOrderById(id),
  create: (data: any) => productionApi.createOrder(data),
  update: (id: string, data: any) => productionApi.updateOrder(id, data),
  delete: (id: string) => productionApi.deleteOrder(id),
  release: (id: string) => productionApi.releaseOrder(id),
  start: (id: string, data?: any) => productionApi.startOrder(id, data),
  complete: (id: string, data?: any) => productionApi.completeOrder(id, data),
  cancel: (id: string, data?: any) => productionApi.cancelOrder(id, data),
};

export const productionExecutionsApi = {
  getAll: (params?: any) => productionApi.getAllExecutions(params),
  getById: (id: string) => productionApi.getExecutionById(id),
  create: (data: any) => productionApi.createExecution(data),
  update: (id: string, data: any) => productionApi.updateExecution(id, data),
  delete: (id: string) => productionApi.deleteExecution(id),
  start: (id: string) => productionApi.startExecution(id),
  consume: (id: string) => productionApi.consumeMaterials(id),
  complete: (id: string, data?: any) => productionApi.completeExecution(id, data),
  cancel: (id: string, data?: any) => productionApi.cancelExecution(id, data),
};
