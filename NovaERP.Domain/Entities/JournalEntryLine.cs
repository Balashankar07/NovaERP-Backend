using NovaERP.Domain.Common;

namespace NovaERP.Domain.Entities;

public class JournalEntryLine : BaseEntity
{
    public Guid JournalEntryId { get; set; }
    public JournalEntry JournalEntry { get; set; } = null!;

    public Guid AccountId { get; set; }
    public ChartOfAccount Account { get; set; } = null!;

    public string AccountCode { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
}
