using NovaERP.Domain.Enums;

namespace NovaERP.Application.Features.Warranties.DTOs;

public class WarrantyDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? ProductCode { get; set; }
    public Guid ShipmentId { get; set; }
    public string? TrackingNumber { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public string WarrantyType { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public WarrantyStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
