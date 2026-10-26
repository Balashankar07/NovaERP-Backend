using System;
using System.Collections.Generic;

namespace NovaERP.Application.Features.Warranties.DTOs;

public class EligibleShipmentDto
{
    public Guid Id { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;
    public string? CourierName { get; set; }
    public DateTime? DeliveryDate { get; set; }
    public string? OrderNumber { get; set; }
    public string? CustomerName { get; set; }
    public List<EligibleShipmentItemDto> Items { get; set; } = new();
}

public class EligibleShipmentItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductCode { get; set; }
    public string? SKU { get; set; }
    public decimal Quantity { get; set; }
    public int RegisteredWarrantyCount { get; set; }
    public decimal RemainingEligibleQuantity { get; set; }
}
