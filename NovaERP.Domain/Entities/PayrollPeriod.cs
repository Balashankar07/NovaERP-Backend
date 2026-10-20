using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class PayrollPeriod : AuditableEntity
{
    public string PeriodName { get; set; } = string.Empty;
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }

    public PayrollStatus Status { get; set; } = PayrollStatus.Draft;

    public ICollection<PayrollEntry> Entries { get; set; } = new List<PayrollEntry>();
}
