using System;
using System.Collections.Generic;
using NovaERP.Domain.Enums;

namespace NovaERP.Application.DTOs.LogisticsDocuments;

public class PackingListDto
{
    public Guid Id { get; set; }
    public string PackingListNumber { get; set; } = string.Empty;

    public Guid ShipmentId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;

    public Guid SalesOrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;

    public Guid DistributorId { get; set; }
    public string CustomerName { get; set; } = string.Empty;

    public Guid? WarehouseId { get; set; }
    public string? WarehouseName { get; set; }

    public DateTime PackingDate { get; set; }
    public Guid? PackedByUserId { get; set; }
    public string? PackedByUserName { get; set; }

    public int TotalPackages { get; set; }
    public decimal? TotalWeightKg { get; set; }
    public string? PackageDimensions { get; set; }

    public PackingListStatus Status { get; set; }
    public string StatusText => Status.ToString();
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    public List<PackingListItemDto> Items { get; set; } = new();
}

public class PackingListItemDto
{
    public Guid Id { get; set; }
    public Guid PackingListId { get; set; }

    public Guid SalesOrderItemId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;

    public Guid? BatchId { get; set; }
    public string? BatchNumber { get; set; }

    public Guid? SerialNumberId { get; set; }
    public string? SerialNumberText { get; set; }

    public decimal Quantity { get; set; }
    public int PackageNumber { get; set; }
    public string? Description { get; set; }
}

public class CreatePackingListDto
{
    public Guid ShipmentId { get; set; }
    public int TotalPackages { get; set; } = 1;
    public decimal? TotalWeightKg { get; set; }
    public string? PackageDimensions { get; set; }
    public string? Notes { get; set; }

    public List<CreatePackingListItemDto> Items { get; set; } = new();
}

public class CreatePackingListItemDto
{
    public Guid SalesOrderItemId { get; set; }
    public Guid ProductId { get; set; }
    public Guid? BatchId { get; set; }
    public Guid? SerialNumberId { get; set; }
    public decimal Quantity { get; set; }
    public int PackageNumber { get; set; } = 1;
    public string? Description { get; set; }
}

public class DeliveryChallanDto
{
    public Guid Id { get; set; }
    public string ChallanNumber { get; set; } = string.Empty;

    public Guid ShipmentId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;

    public Guid SalesOrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;

    public Guid DistributorId { get; set; }
    public string CustomerName { get; set; } = string.Empty;

    public Guid? WarehouseId { get; set; }
    public string? WarehouseName { get; set; }

    public DateTime IssueDate { get; set; }
    public Guid? IssuedByUserId { get; set; }
    public string? IssuedByUserName { get; set; }

    public string Carrier { get; set; } = string.Empty;
    public string? VehicleNumber { get; set; }
    public string DestinationAddress { get; set; } = string.Empty;

    public DeliveryChallanStatus Status { get; set; }
    public string StatusText => Status.ToString();
    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; }

    public List<DeliveryChallanItemDto> Items { get; set; } = new();
}

public class DeliveryChallanItemDto
{
    public Guid Id { get; set; }
    public Guid DeliveryChallanId { get; set; }

    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;

    public Guid SalesOrderItemId { get; set; }

    public Guid? BatchId { get; set; }
    public string? BatchNumber { get; set; }

    public Guid? SerialNumberId { get; set; }
    public string? SerialNumberText { get; set; }

    public decimal Quantity { get; set; }
    public string UnitOfMeasure { get; set; } = "PCS";
}

public class CreateDeliveryChallanDto
{
    public Guid ShipmentId { get; set; }
    public string Carrier { get; set; } = string.Empty;
    public string? VehicleNumber { get; set; }
    public string DestinationAddress { get; set; } = string.Empty;
    public string? Remarks { get; set; }

    public List<CreateDeliveryChallanItemDto> Items { get; set; } = new();
}

public class CreateDeliveryChallanItemDto
{
    public Guid ProductId { get; set; }
    public Guid SalesOrderItemId { get; set; }
    public Guid? BatchId { get; set; }
    public Guid? SerialNumberId { get; set; }
    public decimal Quantity { get; set; }
    public string UnitOfMeasure { get; set; } = "PCS";
}

public class ShipmentDocumentDto
{
    public Guid Id { get; set; }
    public Guid ShipmentId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;

    public LogisticsDocumentType DocumentType { get; set; }
    public string DocumentTypeText => DocumentType.ToString();
    public string DocumentNumber { get; set; } = string.Empty;
    public DateTime DocumentDate { get; set; }
    public string Status { get; set; } = "Active";

    public DateTime GeneratedAt { get; set; }
    public Guid? GeneratedByUserId { get; set; }

    public Guid? PackingListId { get; set; }
    public Guid? DeliveryChallanId { get; set; }
    public Guid? CustomerInvoiceId { get; set; }
    public string? InvoiceNumber { get; set; }

    public string? StorageReference { get; set; }
}

public class LogisticsDocumentsOverviewDto
{
    public int TotalPackingLists { get; set; }
    public int DraftPackingLists { get; set; }
    public int IssuedPackingLists { get; set; }

    public int TotalDeliveryChallans { get; set; }
    public int DraftDeliveryChallans { get; set; }
    public int IssuedDeliveryChallans { get; set; }

    public int TotalShipmentDocuments { get; set; }
    public int LinkedInvoicesCount { get; set; }
}
