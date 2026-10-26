using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class WarehouseLocation : AuditableEntity
{
    public Guid WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }

    public Guid? ParentLocationId { get; set; }
    public WarehouseLocation? ParentLocation { get; set; }

    public LocationType Type { get; set; } = LocationType.Bin;

    public string LocationCode { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
    public string? Zone { get; set; }
    public string? Rack { get; set; }
    public string? Shelf { get; set; }
    public string? Bin { get; set; }
    public string? Description { get; set; }
    public bool IsQuarantine { get; set; } = false;
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<WarehouseLocation> ChildLocations { get; set; } = new List<WarehouseLocation>();
}
