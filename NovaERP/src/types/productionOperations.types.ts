export type MachineStatus = 'Available' | 'Scheduled' | 'Running' | 'Maintenance' | 'Offline' | number;
export type ScheduleStatus = 'Planned' | 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled' | number;
export type ProductionEventType = 'Downtime' | 'Setup' | 'Maintenance' | 'Break' | 'MaterialWaiting' | 'QualityHold' | 'Other' | number;

export interface WorkCenter {
  id: string;
  code: string;
  name: string;
  description?: string;
  departmentId?: string;
  departmentName?: string;
  warehouseId?: string;
  warehouseName?: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateWorkCenterDto {
  code: string;
  name: string;
  description?: string;
  departmentId?: string;
  warehouseId?: string;
  capacity: number;
  isActive?: boolean;
}

export interface UpdateWorkCenterDto {
  name: string;
  description?: string;
  departmentId?: string;
  warehouseId?: string;
  capacity: number;
  isActive: boolean;
}

export interface Machine {
  id: string;
  machineCode: string;
  machineName: string;
  workCenterId: string;
  workCenterName: string;
  machineType?: string;
  status: MachineStatus;
  capacity: number;
  location?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateMachineDto {
  machineCode: string;
  machineName: string;
  workCenterId: string;
  machineType?: string;
  status?: MachineStatus;
  capacity: number;
  location?: string;
  isActive?: boolean;
}

export interface UpdateMachineDto {
  machineName: string;
  workCenterId: string;
  machineType?: string;
  status: MachineStatus;
  capacity: number;
  location?: string;
  isActive: boolean;
}

export interface ProductionRoutingOperation {
  id: string;
  routingId: string;
  sequenceNumber: number;
  operationName: string;
  workCenterId: string;
  workCenterName: string;
  machineId?: string;
  machineName?: string;
  standardDurationMinutes: number;
  setupDurationMinutes: number;
  description?: string;
}

export interface ProductionRouting {
  id: string;
  productId: string;
  productName: string;
  routingVersion: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  operations: ProductionRoutingOperation[];
}

export interface CreateProductionRoutingOperationDto {
  sequenceNumber: number;
  operationName: string;
  workCenterId: string;
  machineId?: string;
  standardDurationMinutes: number;
  setupDurationMinutes: number;
  description?: string;
}

export interface CreateProductionRoutingDto {
  productId: string;
  routingVersion: string;
  description?: string;
  operations: CreateProductionRoutingOperationDto[];
}

export interface ProductionWorkerAssignment {
  id: string;
  productionExecutionId: string;
  executionNumber: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  roleOrFunction: string;
  startTime: string;
  endTime?: string;
  status: string;
  remarks?: string;
}

export interface CreateWorkerAssignmentDto {
  productionExecutionId: string;
  employeeId: string;
  roleOrFunction?: string;
  remarks?: string;
}

export interface ProductionSchedule {
  id: string;
  productionOrderId: string;
  orderNumber: string;
  operationId?: string;
  operationName?: string;
  workCenterId: string;
  workCenterName: string;
  machineId?: string;
  machineName?: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: ScheduleStatus;
  remarks?: string;
}

export interface CreateProductionScheduleDto {
  productionOrderId: string;
  operationId?: string;
  workCenterId: string;
  machineId?: string;
  plannedStart: string;
  plannedEnd: string;
  remarks?: string;
}

export interface UpdateScheduleStatusDto {
  status: ScheduleStatus;
  actualStart?: string;
  actualEnd?: string;
  remarks?: string;
}

export interface ProductionEvent {
  id: string;
  productionExecutionId: string;
  executionNumber: string;
  machineId?: string;
  machineName?: string;
  employeeId?: string;
  employeeName?: string;
  eventType: ProductionEventType;
  startTime: string;
  endTime?: string;
  reason?: string;
  remarks?: string;
}

export interface CreateProductionEventDto {
  productionExecutionId: string;
  machineId?: string;
  employeeId?: string;
  eventType: ProductionEventType;
  startTime: string;
  endTime?: string;
  reason?: string;
  remarks?: string;
}

export interface ProductionOperationsSummary {
  totalWorkCenters: number;
  activeWorkCenters: number;
  totalMachines: number;
  runningMachines: number;
  maintenanceMachines: number;
  totalRoutings: number;
  activeWorkerAssignments: number;
  scheduledJobs: number;
  inProgressJobs: number;
  totalDowntimeEvents: number;
  recentEvents: ProductionEvent[];
}
