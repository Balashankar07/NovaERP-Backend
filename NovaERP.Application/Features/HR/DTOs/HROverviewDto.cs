namespace NovaERP.Application.Features.HR.DTOs;

public class HROverviewDto
{
    public int TotalEmployees { get; set; }
    public int ActiveEmployees { get; set; }
    public int TotalDepartments { get; set; }
    public int PresentToday { get; set; }
    public int OnLeaveToday { get; set; }
    public int PendingLeaveRequests { get; set; }
    public decimal MonthlyPayrollExpense { get; set; }
}

public class HRReportsSummaryDto
{
    public List<DepartmentHeadcountDto> DepartmentHeadcounts { get; set; } = new();
    public List<AttendanceSummaryItemDto> AttendanceSummary { get; set; } = new();
    public List<PayrollSummaryItemDto> PayrollSummary { get; set; } = new();
}

public class DepartmentHeadcountDto
{
    public string DepartmentName { get; set; } = string.Empty;
    public int EmployeeCount { get; set; }
    public decimal TotalBaseSalary { get; set; }
}

public class AttendanceSummaryItemDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class PayrollSummaryItemDto
{
    public string PeriodName { get; set; } = string.Empty;
    public decimal TotalGrossPay { get; set; }
    public decimal TotalNetPay { get; set; }
    public string Status { get; set; } = string.Empty;
}
