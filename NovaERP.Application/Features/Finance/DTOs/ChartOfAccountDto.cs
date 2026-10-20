using NovaERP.Domain.Enums;

namespace NovaERP.Application.Features.Finance.DTOs;

public class ChartOfAccountDto
{
    public Guid Id { get; set; }
    public string AccountCode { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public AccountType Type { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public decimal CurrentBalance { get; set; }
}

public class CreateChartOfAccountDto
{
    public string AccountCode { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public AccountType Type { get; set; }
    public string? Description { get; set; }
}
