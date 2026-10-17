import { api } from "@/lib/api-helper";
import { PagedResult } from '../types/common.types';
import {
  Department,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  EmployeeProfile,
  CreateEmployeeProfileDto,
  UpdateEmployeeProfileDto,
  AttendanceRecord,
  CreateAttendanceRecordDto,
  LeaveType,
  CreateLeaveTypeDto,
  LeaveRequest,
  CreateLeaveRequestDto,
  LeaveDecisionDto,
  PayrollPeriod,
  CreatePayrollPeriodDto,
  PayrollEntry,
  HROverview,
  HRReportsSummary
} from '../types/hr.types';

export const hrApi = {
  // Overview & Reports
  getOverview: () =>
    api.get<HROverview>('/HR/overview'),

  getReportsSummary: () =>
    api.get<HRReportsSummary>('/HR/reports/summary'),

  // Departments
  getDepartments: (params?: { pageNumber?: number; pageSize?: number; search?: string }) =>
    api.get<PagedResult<Department>>('/HR/departments', { params }),

  getDepartmentById: (id: string) =>
    api.get<Department>(`/HR/departments/${id}`),

  createDepartment: (data: CreateDepartmentDto) =>
    api.post<Department>('/HR/departments', data),

  updateDepartment: (id: string, data: UpdateDepartmentDto) =>
    api.put<Department>(`/HR/departments/${id}`, data),

  // Employee Profiles
  getEmployees: (params?: { pageNumber?: number; pageSize?: number; search?: string; departmentId?: string }) =>
    api.get<PagedResult<EmployeeProfile>>('/HR/employees', { params }),

  getEmployeeById: (id: string) =>
    api.get<EmployeeProfile>(`/HR/employees/${id}`),

  getEmployeeByUserId: (userId: string) =>
    api.get<EmployeeProfile>(`/HR/employees/user/${userId}`),

  createEmployee: (data: CreateEmployeeProfileDto) =>
    api.post<EmployeeProfile>('/HR/employees', data),

  updateEmployee: (id: string, data: UpdateEmployeeProfileDto) =>
    api.put<EmployeeProfile>(`/HR/employees/${id}`, data),

  // Attendance
  getAttendance: (params?: { pageNumber?: number; pageSize?: number; employeeId?: string; date?: string }) =>
    api.get<PagedResult<AttendanceRecord>>('/HR/attendance', { params }),

  recordAttendance: (data: CreateAttendanceRecordDto) =>
    api.post<AttendanceRecord>('/HR/attendance', data),

  // Leave Management
  getLeaveTypes: () =>
    api.get<LeaveType[]>('/HR/leave-types'),

  createLeaveType: (data: CreateLeaveTypeDto) =>
    api.post<LeaveType>('/HR/leave-types', data),

  getLeaveRequests: (params?: { pageNumber?: number; pageSize?: number; employeeId?: string }) =>
    api.get<PagedResult<LeaveRequest>>('/HR/leave-requests', { params }),

  getLeaveRequestById: (id: string) =>
    api.get<LeaveRequest>(`/HR/leave-requests/${id}`),

  createLeaveRequest: (data: CreateLeaveRequestDto) =>
    api.post<LeaveRequest>('/HR/leave-requests', data),

  approveLeaveRequest: (id: string, data: LeaveDecisionDto) =>
    api.post<LeaveRequest>(`/HR/leave-requests/${id}/approve`, data),

  rejectLeaveRequest: (id: string, data: LeaveDecisionDto) =>
    api.post<LeaveRequest>(`/HR/leave-requests/${id}/reject`, data),

  // Payroll
  getPayrollPeriods: (params?: { pageNumber?: number; pageSize?: number }) =>
    api.get<PagedResult<PayrollPeriod>>('/HR/payroll/periods', { params }),

  createPayrollPeriod: (data: CreatePayrollPeriodDto) =>
    api.post<PayrollPeriod>('/HR/payroll/periods', data),

  getPayrollEntries: (params?: { pageNumber?: number; pageSize?: number; periodId?: string; employeeId?: string }) =>
    api.get<PagedResult<PayrollEntry>>('/HR/payroll/entries', { params }),

  processPayroll: (periodId: string) =>
    api.post<PayrollEntry[]>('/HR/payroll/process', { periodId }),

  approvePayrollPeriod: (periodId: string) =>
    api.post<PayrollPeriod>(`/HR/payroll/periods/${periodId}/approve`),

  payPayrollPeriod: (periodId: string) =>
    api.post<PayrollPeriod>(`/HR/payroll/periods/${periodId}/pay`),
};
