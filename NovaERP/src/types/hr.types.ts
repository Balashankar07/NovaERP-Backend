export type EmploymentStatus = 'Active' | 'Inactive' | 'OnLeave' | 'Terminated' | number;
export type EmploymentType = 'FullTime' | 'PartTime' | 'Contract' | 'Intern' | number;
export type AttendanceStatus = 'Present' | 'Absent' | 'HalfDay' | 'Leave' | 'Holiday' | number;
export type LeaveStatus = 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected' | 'Cancelled' | number;
export type PayrollStatus = 'Draft' | 'Processed' | 'Approved' | 'Paid' | 'Cancelled' | number;

export interface Department {
  id: string;
  departmentCode: string;
  departmentName: string;
  description?: string;
  managerUserId?: string;
  managerUserName?: string;
  isActive: boolean;
  employeeCount: number;
  createdAt: string;
}

export interface CreateDepartmentDto {
  departmentCode: string;
  departmentName: string;
  description?: string;
  managerUserId?: string;
}

export interface UpdateDepartmentDto {
  departmentName: string;
  description?: string;
  managerUserId?: string;
  isActive: boolean;
}

export interface EmployeeProfile {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  employeeCode: string;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  designation: string;
  employmentType: EmploymentType;
  status: EmploymentStatus;
  dateOfJoining: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  baseSalary: number;
  bankName?: string;
  accountNumber?: string;
  createdAt: string;
}

export interface CreateEmployeeProfileDto {
  userId: string;
  employeeCode: string;
  departmentId: string;
  designation: string;
  employmentType: EmploymentType;
  dateOfJoining: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  baseSalary: number;
  bankName?: string;
  accountNumber?: string;
}

export interface UpdateEmployeeProfileDto {
  departmentId: string;
  designation: string;
  employmentType: EmploymentType;
  status: EmploymentStatus;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  baseSalary: number;
  bankName?: string;
  accountNumber?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  attendanceDate: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  workHours: number;
  remarks?: string;
  createdAt: string;
}

export interface CreateAttendanceRecordDto {
  employeeId: string;
  attendanceDate: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface LeaveType {
  id: string;
  name: string;
  description?: string;
  defaultDaysPerYear: number;
  isActive: boolean;
}

export interface CreateLeaveTypeDto {
  name: string;
  description?: string;
  defaultDaysPerYear: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  status: LeaveStatus;
  approverUserId?: string;
  approverUserName?: string;
  decisionDate?: string;
  decisionRemarks?: string;
  createdAt: string;
}

export interface CreateLeaveRequestDto {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveDecisionDto {
  remarks?: string;
}

export interface PayrollPeriod {
  id: string;
  periodName: string;
  periodStart: string;
  periodEnd: string;
  status: PayrollStatus;
  totalEntries: number;
  totalGrossPay: number;
  totalNetPay: number;
  createdAt: string;
}

export interface CreatePayrollPeriodDto {
  periodName: string;
  periodStart: string;
  periodEnd: string;
}

export interface PayrollEntry {
  id: string;
  periodId: string;
  periodName: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  grossPay: number;
  netPay: number;
  status: PayrollStatus;
  approvalJournalEntryId?: string;
  paymentJournalEntryId?: string;
  createdAt: string;
}

export interface HROverview {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  presentToday: number;
  onLeaveToday: number;
  pendingLeaveRequests: number;
  monthlyPayrollExpense: number;
}

export interface HRReportsSummary {
  departmentHeadcounts: {
    departmentName: string;
    employeeCount: number;
    totalBaseSalary: number;
  }[];
  attendanceSummary: {
    status: string;
    count: number;
  }[];
  payrollSummary: {
    periodName: string;
    totalGrossPay: number;
    totalNetPay: number;
    status: string;
  }[];
}
