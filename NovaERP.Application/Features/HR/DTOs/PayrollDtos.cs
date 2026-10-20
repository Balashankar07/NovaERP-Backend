using NovaERP.Domain.Enums;

namespace NovaERP.Application.Features.HR.DTOs;

public class PayrollPeriodDto
{
    public Guid Id { get; set; }
    public string PeriodName { get; set; } = string.Empty;
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public PayrollStatus Status { get; set; }
    public int TotalEntries { get; set; }
    public decimal TotalGrossPay { get; set; }
    public decimal TotalNetPay { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePayrollPeriodDto
{
    public string PeriodName { get; set; } = string.Empty;
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
}

public class PayrollEntryDto
{
    public Guid Id { get; set; }
    public Guid PeriodId { get; set; }
    public string PeriodName { get; set; } = string.Empty;
    public Guid EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public decimal BaseSalary { get; set; }
    public decimal Allowances { get; set; }
    public decimal Deductions { get; set; }
    public decimal GrossPay { get; set; }
    public decimal NetPay { get; set; }
    public PayrollStatus Status { get; set; }
    public Guid? ApprovalJournalEntryId { get; set; }
    public Guid? PaymentJournalEntryId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ProcessPayrollDto
{
    public Guid PeriodId { get; set; }
}

public class CreatePayrollEntryDto
{
    public Guid PeriodId { get; set; }
    public Guid EmployeeId { get; set; }
    public decimal Allowances { get; set; }
    public decimal Deductions { get; set; }
}
