using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.HR.DTOs;

namespace NovaERP.Application.Interfaces.Services;

public interface IHRService
{
    // Overview & Reports
    Task<HROverviewDto> GetOverviewAsync(CancellationToken cancellationToken = default);
    Task<HRReportsSummaryDto> GetReportsSummaryAsync(CancellationToken cancellationToken = default);

    // Departments
    Task<PagedResult<DepartmentDto>> GetDepartmentsAsync(int pageNumber = 1, int pageSize = 10, string? search = null, CancellationToken cancellationToken = default);
    Task<DepartmentDto> GetDepartmentByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DepartmentDto> CreateDepartmentAsync(CreateDepartmentDto dto, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<DepartmentDto> UpdateDepartmentAsync(Guid id, UpdateDepartmentDto dto, Guid currentUserId, CancellationToken cancellationToken = default);

    // Employees
    Task<PagedResult<EmployeeProfileDto>> GetEmployeesAsync(int pageNumber = 1, int pageSize = 10, string? search = null, Guid? departmentId = null, CancellationToken cancellationToken = default);
    Task<EmployeeProfileDto> GetEmployeeByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<EmployeeProfileDto> GetEmployeeByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<EmployeeProfileDto> CreateEmployeeAsync(CreateEmployeeProfileDto dto, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<EmployeeProfileDto> UpdateEmployeeAsync(Guid id, UpdateEmployeeProfileDto dto, Guid currentUserId, CancellationToken cancellationToken = default);

    // Attendance
    Task<PagedResult<AttendanceRecordDto>> GetAttendanceRecordsAsync(int pageNumber = 1, int pageSize = 10, Guid? employeeId = null, DateTime? date = null, CancellationToken cancellationToken = default);
    Task<AttendanceRecordDto> RecordAttendanceAsync(CreateAttendanceRecordDto dto, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<AttendanceRecordDto> UpdateAttendanceAsync(Guid id, UpdateAttendanceRecordDto dto, Guid currentUserId, CancellationToken cancellationToken = default);

    // Leave Types & Requests
    Task<List<LeaveTypeDto>> GetLeaveTypesAsync(CancellationToken cancellationToken = default);
    Task<LeaveTypeDto> CreateLeaveTypeAsync(CreateLeaveTypeDto dto, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<PagedResult<LeaveRequestDto>> GetLeaveRequestsAsync(int pageNumber = 1, int pageSize = 10, Guid? employeeId = null, CancellationToken cancellationToken = default);
    Task<LeaveRequestDto> GetLeaveRequestByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<LeaveRequestDto> CreateLeaveRequestAsync(CreateLeaveRequestDto dto, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<LeaveRequestDto> ApproveLeaveRequestAsync(Guid id, LeaveDecisionDto dto, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<LeaveRequestDto> RejectLeaveRequestAsync(Guid id, LeaveDecisionDto dto, Guid currentUserId, CancellationToken cancellationToken = default);

    // Payroll
    Task<PagedResult<PayrollPeriodDto>> GetPayrollPeriodsAsync(int pageNumber = 1, int pageSize = 10, CancellationToken cancellationToken = default);
    Task<PayrollPeriodDto> CreatePayrollPeriodAsync(CreatePayrollPeriodDto dto, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<PagedResult<PayrollEntryDto>> GetPayrollEntriesAsync(int pageNumber = 1, int pageSize = 10, Guid? periodId = null, Guid? employeeId = null, CancellationToken cancellationToken = default);
    Task<List<PayrollEntryDto>> ProcessPayrollForPeriodAsync(Guid periodId, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<PayrollPeriodDto> ApprovePayrollPeriodAsync(Guid periodId, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<PayrollPeriodDto> PayPayrollPeriodAsync(Guid periodId, Guid currentUserId, CancellationToken cancellationToken = default);
}
