using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class PayrollEntry : AuditableEntity
{
    public Guid PeriodId { get; set; }
    public PayrollPeriod? Period { get; set; }

    public Guid EmployeeId { get; set; }
    public EmployeeProfile? Employee { get; set; }

    public decimal BaseSalary { get; set; }
    public decimal Allowances { get; set; }
    public decimal Deductions { get; set; }

    public decimal GrossPay { get; set; }
    public decimal NetPay { get; set; }

    public PayrollStatus Status { get; set; } = PayrollStatus.Draft;

    public Guid? ApprovalJournalEntryId { get; set; }
    public JournalEntry? ApprovalJournalEntry { get; set; }

    public Guid? PaymentJournalEntryId { get; set; }
    public JournalEntry? PaymentJournalEntry { get; set; }
}
