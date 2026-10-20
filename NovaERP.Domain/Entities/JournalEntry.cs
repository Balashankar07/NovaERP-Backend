using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class JournalEntry : AuditableEntity
{
    public string EntryNumber { get; set; } = string.Empty;
    public DateTime EntryDate { get; set; }
    public string Description { get; set; } = string.Empty;

    public string? SourceDocumentType { get; set; }
    public Guid? SourceDocumentId { get; set; }

    public JournalStatus Status { get; set; } = JournalStatus.Draft;

    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }

    public ICollection<JournalEntryLine> Lines { get; set; } = new List<JournalEntryLine>();
}
