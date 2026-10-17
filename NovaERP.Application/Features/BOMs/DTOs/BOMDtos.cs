namespace NovaERP.Application.Features.BOMs.DTOs;

public class BOMDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime EffectiveDate { get; set; }
    public bool IsActive { get; set; }
    public List<BOMItemDto> Items { get; set; } = new();
}

public class CreateBOMDto
{
    public Guid ProductId { get; set; }
    public string Version { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime EffectiveDate { get; set; }
    public bool IsActive { get; set; } = true;
    public List<CreateBOMItemDto> Items { get; set; } = new();
}

public class UpdateBOMDto
{
    public string Version { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime EffectiveDate { get; set; }
    public bool IsActive { get; set; } = true;
    public List<UpdateBOMItemDto> Items { get; set; } = new();
}
