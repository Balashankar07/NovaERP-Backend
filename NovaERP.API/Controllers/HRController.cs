using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.HR.DTOs;
using NovaERP.Application.Interfaces.Services;
using System.Security.Claims;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HRController : ControllerBase
{
    private readonly IHRService _hrService;

    public HRController(IHRService hrService)
    {
        _hrService = hrService;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }

    #region Overview & Reports

    [HttpGet("overview")]
    [HasPermission("Permissions.HR.View")]
    public async Task<ActionResult<ApiResponse<HROverviewDto>>> GetOverview(CancellationToken cancellationToken)
    {
        var result = await _hrService.GetOverviewAsync(cancellationToken);
        return Ok(ApiResponse.SuccessResponse("HR overview retrieved successfully", result));
    }

    [HttpGet("reports/summary")]
    [HasPermission("Permissions.HR.Reports.View")]
    public async Task<ActionResult<ApiResponse<HRReportsSummaryDto>>> GetReportsSummary(CancellationToken cancellationToken)
    {
        var result = await _hrService.GetReportsSummaryAsync(cancellationToken);
        return Ok(ApiResponse.SuccessResponse("HR reports summary retrieved successfully", result));
    }

    #endregion

    #region Departments

    [HttpGet("departments")]
    [HasPermission("Permissions.HR.Departments.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<DepartmentDto>>>> GetDepartments(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _hrService.GetDepartmentsAsync(pageNumber, pageSize, search, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Departments retrieved successfully", result));
    }

    [HttpGet("departments/{id}")]
    [HasPermission("Permissions.HR.Departments.View")]
    public async Task<ActionResult<ApiResponse<DepartmentDto>>> GetDepartmentById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _hrService.GetDepartmentByIdAsync(id, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Department retrieved successfully", result));
    }

    [HttpPost("departments")]
    [HasPermission("Permissions.HR.Departments.Create")]
    public async Task<ActionResult<ApiResponse<DepartmentDto>>> CreateDepartment([FromBody] CreateDepartmentDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _hrService.CreateDepartmentAsync(dto, userId, cancellationToken);
        return CreatedAtAction(nameof(GetDepartmentById), new { id = result.Id }, ApiResponse.SuccessResponse("Department created successfully", result));
    }

    [HttpPut("departments/{id}")]
    [HasPermission("Permissions.HR.Departments.Update")]
    public async Task<ActionResult<ApiResponse<DepartmentDto>>> UpdateDepartment(Guid id, [FromBody] UpdateDepartmentDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _hrService.UpdateDepartmentAsync(id, dto, userId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Department updated successfully", result));
    }

    #endregion

    #region Employee Profiles

    [HttpGet("employees")]
    [HasPermission("Permissions.HR.Employees.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<EmployeeProfileDto>>>> GetEmployees(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] Guid? departmentId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _hrService.GetEmployeesAsync(pageNumber, pageSize, search, departmentId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Employees retrieved successfully", result));
    }

    [HttpGet("employees/{id}")]
    [HasPermission("Permissions.HR.Employees.View")]
    public async Task<ActionResult<ApiResponse<EmployeeProfileDto>>> GetEmployeeById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _hrService.GetEmployeeByIdAsync(id, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Employee profile retrieved successfully", result));
    }

    [HttpGet("employees/user/{userId}")]
    [HasPermission("Permissions.HR.Employees.View")]
    public async Task<ActionResult<ApiResponse<EmployeeProfileDto>>> GetEmployeeByUserId(Guid userId, CancellationToken cancellationToken)
    {
        var result = await _hrService.GetEmployeeByUserIdAsync(userId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Employee profile retrieved successfully", result));
    }

    [HttpPost("employees")]
    [HasPermission("Permissions.HR.Employees.Create")]
    public async Task<ActionResult<ApiResponse<EmployeeProfileDto>>> CreateEmployee([FromBody] CreateEmployeeProfileDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = GetUserId();
        var result = await _hrService.CreateEmployeeAsync(dto, currentUserId, cancellationToken);
        return CreatedAtAction(nameof(GetEmployeeById), new { id = result.Id }, ApiResponse.SuccessResponse("Employee profile created successfully", result));
    }

    [HttpPut("employees/{id}")]
    [HasPermission("Permissions.HR.Employees.Update")]
    public async Task<ActionResult<ApiResponse<EmployeeProfileDto>>> UpdateEmployee(Guid id, [FromBody] UpdateEmployeeProfileDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = GetUserId();
        var result = await _hrService.UpdateEmployeeAsync(id, dto, currentUserId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Employee profile updated successfully", result));
    }

    #endregion

    #region Attendance

    [HttpGet("attendance")]
    [HasPermission("Permissions.HR.Attendance.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<AttendanceRecordDto>>>> GetAttendance(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? employeeId = null,
        [FromQuery] DateTime? date = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _hrService.GetAttendanceRecordsAsync(pageNumber, pageSize, employeeId, date, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Attendance records retrieved successfully", result));
    }

    [HttpPost("attendance")]
    [HasPermission("Permissions.HR.Attendance.Create")]
    public async Task<ActionResult<ApiResponse<AttendanceRecordDto>>> RecordAttendance([FromBody] CreateAttendanceRecordDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = GetUserId();
        var result = await _hrService.RecordAttendanceAsync(dto, currentUserId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Attendance recorded successfully", result));
    }

    [HttpPut("attendance/{id}")]
    [HasPermission("Permissions.HR.Attendance.Update")]
    public async Task<ActionResult<ApiResponse<AttendanceRecordDto>>> UpdateAttendance(Guid id, [FromBody] UpdateAttendanceRecordDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = GetUserId();
        var result = await _hrService.UpdateAttendanceAsync(id, dto, currentUserId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Attendance updated successfully", result));
    }

    #endregion

    #region Leave Management

    [HttpGet("leave-types")]
    [HasPermission("Permissions.HR.Leave.View")]
    public async Task<ActionResult<ApiResponse<List<LeaveTypeDto>>>> GetLeaveTypes(CancellationToken cancellationToken)
    {
        var result = await _hrService.GetLeaveTypesAsync(cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Leave types retrieved successfully", result));
    }

    [HttpPost("leave-types")]
    [HasPermission("Permissions.HR.Leave.Create")]
    public async Task<ActionResult<ApiResponse<LeaveTypeDto>>> CreateLeaveType([FromBody] CreateLeaveTypeDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = GetUserId();
        var result = await _hrService.CreateLeaveTypeAsync(dto, currentUserId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Leave type created successfully", result));
    }

    [HttpGet("leave-requests")]
    [HasPermission("Permissions.HR.Leave.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<LeaveRequestDto>>>> GetLeaveRequests(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? employeeId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _hrService.GetLeaveRequestsAsync(pageNumber, pageSize, employeeId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Leave requests retrieved successfully", result));
    }

    [HttpGet("leave-requests/{id}")]
    [HasPermission("Permissions.HR.Leave.View")]
    public async Task<ActionResult<ApiResponse<LeaveRequestDto>>> GetLeaveRequestById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _hrService.GetLeaveRequestByIdAsync(id, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Leave request retrieved successfully", result));
    }

    [HttpPost("leave-requests")]
    [HasPermission("Permissions.HR.Leave.Create")]
    public async Task<ActionResult<ApiResponse<LeaveRequestDto>>> CreateLeaveRequest([FromBody] CreateLeaveRequestDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = GetUserId();
        var result = await _hrService.CreateLeaveRequestAsync(dto, currentUserId, cancellationToken);
        return CreatedAtAction(nameof(GetLeaveRequestById), new { id = result.Id }, ApiResponse.SuccessResponse("Leave request submitted successfully", result));
    }

    [HttpPost("leave-requests/{id}/approve")]
    [HasPermission("Permissions.HR.Leave.Approve")]
    public async Task<ActionResult<ApiResponse<LeaveRequestDto>>> ApproveLeaveRequest(Guid id, [FromBody] LeaveDecisionDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = GetUserId();
        var result = await _hrService.ApproveLeaveRequestAsync(id, dto, currentUserId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Leave request approved successfully", result));
    }

    [HttpPost("leave-requests/{id}/reject")]
    [HasPermission("Permissions.HR.Leave.Reject")]
    public async Task<ActionResult<ApiResponse<LeaveRequestDto>>> RejectLeaveRequest(Guid id, [FromBody] LeaveDecisionDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = GetUserId();
        var result = await _hrService.RejectLeaveRequestAsync(id, dto, currentUserId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Leave request rejected successfully", result));
    }

    #endregion

    #region Payroll

    [HttpGet("payroll/periods")]
    [HasPermission("Permissions.HR.Payroll.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<PayrollPeriodDto>>>> GetPayrollPeriods(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _hrService.GetPayrollPeriodsAsync(pageNumber, pageSize, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Payroll periods retrieved successfully", result));
    }

    [HttpPost("payroll/periods")]
    [HasPermission("Permissions.HR.Payroll.Create")]
    public async Task<ActionResult<ApiResponse<PayrollPeriodDto>>> CreatePayrollPeriod([FromBody] CreatePayrollPeriodDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = GetUserId();
        var result = await _hrService.CreatePayrollPeriodAsync(dto, currentUserId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Payroll period created successfully", result));
    }

    [HttpGet("payroll/entries")]
    [HasPermission("Permissions.HR.Payroll.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<PayrollEntryDto>>>> GetPayrollEntries(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? periodId = null,
        [FromQuery] Guid? employeeId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _hrService.GetPayrollEntriesAsync(pageNumber, pageSize, periodId, employeeId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Payroll entries retrieved successfully", result));
    }

    [HttpPost("payroll/process")]
    [HasPermission("Permissions.HR.Payroll.Process")]
    public async Task<ActionResult<ApiResponse<List<PayrollEntryDto>>>> ProcessPayroll([FromBody] ProcessPayrollDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = GetUserId();
        var result = await _hrService.ProcessPayrollForPeriodAsync(dto.PeriodId, currentUserId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Payroll processed successfully", result));
    }

    [HttpPost("payroll/periods/{id}/approve")]
    [HasPermission("Permissions.HR.Payroll.Approve")]
    public async Task<ActionResult<ApiResponse<PayrollPeriodDto>>> ApprovePayrollPeriod(Guid id, CancellationToken cancellationToken)
    {
        var currentUserId = GetUserId();
        var result = await _hrService.ApprovePayrollPeriodAsync(id, currentUserId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Payroll period approved and posted to Finance General Ledger", result));
    }

    [HttpPost("payroll/periods/{id}/pay")]
    [HasPermission("Permissions.HR.Payroll.Approve")]
    public async Task<ActionResult<ApiResponse<PayrollPeriodDto>>> PayPayrollPeriod(Guid id, CancellationToken cancellationToken)
    {
        var currentUserId = GetUserId();
        var result = await _hrService.PayPayrollPeriodAsync(id, currentUserId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Payroll period marked as Paid and disbursement posted to Finance Cash", result));
    }

    #endregion
}
