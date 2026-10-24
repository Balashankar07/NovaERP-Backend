using NovaERP.Domain.Enums;

namespace NovaERP.Application.Features.Shipments.DTOs;

public class ShipmentDto
{
    public Guid Id { get; set; }
    public Guid SalesOrderId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;
    public string CourierName { get; set; } = string.Empty;
    public DateTime? DispatchDate { get; set; }
    public DateTime? DeliveryDate { get; set; }
    public ShipmentStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public string? OrderNumber { get; set; }
    public string? CustomerName { get; set; }
    public string? ShippingAddress { get; set; }
    public string? ContactPerson { get; set; }
    public string? ContactPhone { get; set; }

    public List<ShipmentItemDto> ShipmentItems { get; set; } = new();
}
