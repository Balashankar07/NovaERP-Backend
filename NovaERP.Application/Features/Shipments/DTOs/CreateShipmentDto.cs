using System.ComponentModel.DataAnnotations;

namespace NovaERP.Application.Features.Shipments.DTOs;

public class CreateShipmentDto
{
    [Required]
    public Guid SalesOrderId { get; set; }

    [MaxLength(100)]
    public string? TrackingNumber { get; set; }

    [Required]
    [MaxLength(100)]
    public string CourierName { get; set; } = string.Empty;

    [Required]
    public List<CreateShipmentItemDto> ShipmentItems { get; set; } = new();
}

public class CreateShipmentItemDto
{
    [Required]
    public Guid ProductId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Quantity must be greater than zero.")]
    public decimal Quantity { get; set; }
}
