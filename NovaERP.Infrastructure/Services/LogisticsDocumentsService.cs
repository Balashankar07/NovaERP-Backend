using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NovaERP.Application.DTOs.LogisticsDocuments;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Services;

public class LogisticsDocumentsService : ILogisticsDocumentsService
{
    private readonly AppDbContext _context;
    private readonly IAuditLogger _auditLogger;

    public LogisticsDocumentsService(AppDbContext context, IAuditLogger auditLogger)
    {
        _context = context;
        _auditLogger = auditLogger;
    }

    public async Task<LogisticsDocumentsOverviewDto> GetOverviewAsync()
    {
        return new LogisticsDocumentsOverviewDto
        {
            TotalPackingLists = await _context.PackingLists.CountAsync(),
            DraftPackingLists = await _context.PackingLists.CountAsync(p => p.Status == PackingListStatus.Draft),
            IssuedPackingLists = await _context.PackingLists.CountAsync(p => p.Status == PackingListStatus.Issued),

            TotalDeliveryChallans = await _context.DeliveryChallans.CountAsync(),
            DraftDeliveryChallans = await _context.DeliveryChallans.CountAsync(d => d.Status == DeliveryChallanStatus.Draft),
            IssuedDeliveryChallans = await _context.DeliveryChallans.CountAsync(d => d.Status == DeliveryChallanStatus.Issued),

            TotalShipmentDocuments = await _context.ShipmentDocuments.CountAsync(),
            LinkedInvoicesCount = await _context.ShipmentDocuments.CountAsync(s => s.CustomerInvoiceId != null)
        };
    }

    // ==========================================
    // PACKING LISTS
    // ==========================================
    public async Task<List<PackingListDto>> GetPackingListsAsync(Guid? shipmentId = null, Guid? salesOrderId = null)
    {
        var query = _context.PackingLists
            .AsNoTracking()
            .Include(p => p.Shipment)
            .Include(p => p.SalesOrder)
            .Include(p => p.Customer)
            .Include(p => p.Warehouse)
            .Include(p => p.PackedByUser)
            .Include(p => p.Items).ThenInclude(i => i.Product)
            .Include(p => p.Items).ThenInclude(i => i.Batch)
            .Include(p => p.Items).ThenInclude(i => i.SerialNumber)
            .AsQueryable();

        if (shipmentId.HasValue) query = query.Where(p => p.ShipmentId == shipmentId.Value);
        if (salesOrderId.HasValue) query = query.Where(p => p.SalesOrderId == salesOrderId.Value);

        var lists = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return lists.Select(MapToPackingListDto).ToList();
    }

    public async Task<PackingListDto?> GetPackingListByIdAsync(Guid id)
    {
        var packingList = await _context.PackingLists
            .AsNoTracking()
            .Include(p => p.Shipment)
            .Include(p => p.SalesOrder)
            .Include(p => p.Customer)
            .Include(p => p.Warehouse)
            .Include(p => p.PackedByUser)
            .Include(p => p.Items).ThenInclude(i => i.Product)
            .Include(p => p.Items).ThenInclude(i => i.Batch)
            .Include(p => p.Items).ThenInclude(i => i.SerialNumber)
            .FirstOrDefaultAsync(p => p.Id == id);

        return packingList != null ? MapToPackingListDto(packingList) : null;
    }

    public async Task<PackingListDto> CreatePackingListAsync(CreatePackingListDto dto, Guid? userId = null)
    {
        var shipment = await _context.Shipments
            .Include(s => s.SalesOrder)
            .Include(s => s.ShipmentItems)
            .FirstOrDefaultAsync(s => s.Id == dto.ShipmentId);

        if (shipment == null)
            throw new InvalidOperationException($"Shipment with ID {dto.ShipmentId} not found.");

        if (shipment.Status == ShipmentStatus.Cancelled)
            throw new InvalidOperationException($"Cannot create packing list for cancelled shipment {shipment.TrackingNumber}.");

        var salesOrder = shipment.SalesOrder;
        if (salesOrder == null)
            throw new InvalidOperationException($"Linked Sales Order for shipment {dto.ShipmentId} not found.");

        // Duplicate Packing List check for same shipment
        var existingList = await _context.PackingLists
            .FirstOrDefaultAsync(p => p.ShipmentId == dto.ShipmentId && p.Status != PackingListStatus.Cancelled);
        if (existingList != null)
        {
            throw new InvalidOperationException($"Shipment {shipment.TrackingNumber} already has an active Packing List ({existingList.PackingListNumber}).");
        }

        string number = await GenerateDocumentNumberAsync("PL");

        var packingList = new PackingList
        {
            PackingListNumber = number,
            ShipmentId = shipment.Id,
            SalesOrderId = salesOrder.Id,
            DistributorId = salesOrder.DistributorId,
            WarehouseId = null,
            PackingDate = DateTime.UtcNow,
            PackedByUserId = userId,
            TotalPackages = dto.TotalPackages,
            TotalWeightKg = dto.TotalWeightKg,
            PackageDimensions = dto.PackageDimensions,
            Status = PackingListStatus.Draft,
            Notes = dto.Notes
        };

        foreach (var itemDto in dto.Items)
        {
            var shipmentItem = shipment.ShipmentItems.FirstOrDefault(si => si.ProductId == itemDto.ProductId);
            if (shipmentItem != null && itemDto.Quantity > shipmentItem.Quantity)
            {
                throw new InvalidOperationException($"Packing quantity ({itemDto.Quantity}) for product {itemDto.ProductId} exceeds shipment item quantity ({shipmentItem.Quantity}).");
            }

            packingList.Items.Add(new PackingListItem
            {
                SalesOrderItemId = itemDto.SalesOrderItemId,
                ProductId = itemDto.ProductId,
                BatchId = itemDto.BatchId,
                SerialNumberId = itemDto.SerialNumberId,
                Quantity = itemDto.Quantity,
                PackageNumber = itemDto.PackageNumber,
                Description = itemDto.Description
            });
        }

        _context.PackingLists.Add(packingList);

        // Register Shipment Document Reference
        _context.ShipmentDocuments.Add(new ShipmentDocument
        {
            ShipmentId = shipment.Id,
            DocumentType = LogisticsDocumentType.PackingList,
            DocumentNumber = number,
            DocumentDate = DateTime.UtcNow,
            Status = "Draft",
            GeneratedByUserId = userId,
            PackingList = packingList
        });

        await _context.SaveChangesAsync();

        if (userId.HasValue)
        {
            await _auditLogger.LogAsync("CreatePackingList", "PackingList", packingList.Id.ToString(), "", $"Created Draft Packing List {number}");
        }

        return (await GetPackingListByIdAsync(packingList.Id))!;
    }

    public async Task<PackingListDto> UpdatePackingListAsync(Guid id, CreatePackingListDto dto, Guid? userId = null)
    {
        var packingList = await _context.PackingLists
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (packingList == null)
            throw new InvalidOperationException($"Packing List with ID {id} not found.");

        if (packingList.Status != PackingListStatus.Draft)
            throw new InvalidOperationException($"Packing List {packingList.PackingListNumber} is {packingList.Status} and cannot be modified.");

        packingList.TotalPackages = dto.TotalPackages;
        packingList.TotalWeightKg = dto.TotalWeightKg;
        packingList.PackageDimensions = dto.PackageDimensions;
        packingList.Notes = dto.Notes;

        _context.PackingListItems.RemoveRange(packingList.Items);

        foreach (var itemDto in dto.Items)
        {
            packingList.Items.Add(new PackingListItem
            {
                SalesOrderItemId = itemDto.SalesOrderItemId,
                ProductId = itemDto.ProductId,
                BatchId = itemDto.BatchId,
                SerialNumberId = itemDto.SerialNumberId,
                Quantity = itemDto.Quantity,
                PackageNumber = itemDto.PackageNumber,
                Description = itemDto.Description
            });
        }

        await _context.SaveChangesAsync();

        if (userId.HasValue)
        {
            await _auditLogger.LogAsync("UpdatePackingList", "PackingList", packingList.Id.ToString(), "", $"Updated Draft Packing List {packingList.PackingListNumber}");
        }

        return (await GetPackingListByIdAsync(packingList.Id))!;
    }

    public async Task<PackingListDto> IssuePackingListAsync(Guid id, Guid? userId = null)
    {
        var packingList = await _context.PackingLists.FirstOrDefaultAsync(p => p.Id == id);
        if (packingList == null)
            throw new InvalidOperationException($"Packing List with ID {id} not found.");

        if (packingList.Status == PackingListStatus.Issued)
            throw new InvalidOperationException($"Packing List {packingList.PackingListNumber} is already Issued.");

        if (packingList.Status == PackingListStatus.Cancelled)
            throw new InvalidOperationException($"Cannot issue cancelled Packing List {packingList.PackingListNumber}.");

        packingList.Status = PackingListStatus.Issued;

        var doc = await _context.ShipmentDocuments.FirstOrDefaultAsync(s => s.PackingListId == id);
        if (doc != null) doc.Status = "Issued";

        await _context.SaveChangesAsync();

        if (userId.HasValue)
        {
            await _auditLogger.LogAsync("IssuePackingList", "PackingList", packingList.Id.ToString(), "", $"Officially Issued Packing List {packingList.PackingListNumber}");
        }

        return (await GetPackingListByIdAsync(packingList.Id))!;
    }

    public async Task<PackingListDto> CancelPackingListAsync(Guid id, Guid? userId = null)
    {
        var packingList = await _context.PackingLists.FirstOrDefaultAsync(p => p.Id == id);
        if (packingList == null)
            throw new InvalidOperationException($"Packing List with ID {id} not found.");

        if (packingList.Status == PackingListStatus.Cancelled)
            throw new InvalidOperationException($"Packing List {packingList.PackingListNumber} is already Cancelled.");

        packingList.Status = PackingListStatus.Cancelled;

        var doc = await _context.ShipmentDocuments.FirstOrDefaultAsync(s => s.PackingListId == id);
        if (doc != null) doc.Status = "Cancelled";

        await _context.SaveChangesAsync();

        if (userId.HasValue)
        {
            await _auditLogger.LogAsync("CancelPackingList", "PackingList", packingList.Id.ToString(), "", $"Cancelled Packing List {packingList.PackingListNumber}");
        }

        return (await GetPackingListByIdAsync(packingList.Id))!;
    }

    // ==========================================
    // DELIVERY CHALLANS
    // ==========================================
    public async Task<List<DeliveryChallanDto>> GetDeliveryChallansAsync(Guid? shipmentId = null, Guid? salesOrderId = null)
    {
        var query = _context.DeliveryChallans
            .AsNoTracking()
            .Include(d => d.Shipment)
            .Include(d => d.SalesOrder)
            .Include(d => d.Customer)
            .Include(d => d.Warehouse)
            .Include(d => d.IssuedByUser)
            .Include(d => d.Items).ThenInclude(i => i.Product)
            .Include(d => d.Items).ThenInclude(i => i.Batch)
            .Include(d => d.Items).ThenInclude(i => i.SerialNumber)
            .AsQueryable();

        if (shipmentId.HasValue) query = query.Where(d => d.ShipmentId == shipmentId.Value);
        if (salesOrderId.HasValue) query = query.Where(d => d.SalesOrderId == salesOrderId.Value);

        var challans = await query.OrderByDescending(d => d.CreatedAt).ToListAsync();
        return challans.Select(MapToDeliveryChallanDto).ToList();
    }

    public async Task<DeliveryChallanDto?> GetDeliveryChallanByIdAsync(Guid id)
    {
        var challan = await _context.DeliveryChallans
            .AsNoTracking()
            .Include(d => d.Shipment)
            .Include(d => d.SalesOrder)
            .Include(d => d.Customer)
            .Include(d => d.Warehouse)
            .Include(d => d.IssuedByUser)
            .Include(d => d.Items).ThenInclude(i => i.Product)
            .Include(d => d.Items).ThenInclude(i => i.Batch)
            .Include(d => d.Items).ThenInclude(i => i.SerialNumber)
            .FirstOrDefaultAsync(d => d.Id == id);

        return challan != null ? MapToDeliveryChallanDto(challan) : null;
    }

    public async Task<DeliveryChallanDto> CreateDeliveryChallanAsync(CreateDeliveryChallanDto dto, Guid? userId = null)
    {
        var shipment = await _context.Shipments
            .Include(s => s.SalesOrder)
            .Include(s => s.ShipmentItems)
            .FirstOrDefaultAsync(s => s.Id == dto.ShipmentId);

        if (shipment == null)
            throw new InvalidOperationException($"Shipment with ID {dto.ShipmentId} not found.");

        if (shipment.Status == ShipmentStatus.Cancelled)
            throw new InvalidOperationException($"Cannot create Delivery Challan for cancelled shipment {shipment.TrackingNumber}.");

        var salesOrder = shipment.SalesOrder;
        if (salesOrder == null)
            throw new InvalidOperationException($"Linked Sales Order for shipment {dto.ShipmentId} not found.");

        // Duplicate Challan check for same shipment
        var existingChallan = await _context.DeliveryChallans
            .FirstOrDefaultAsync(d => d.ShipmentId == dto.ShipmentId && d.Status != DeliveryChallanStatus.Cancelled);
        if (existingChallan != null)
        {
            throw new InvalidOperationException($"Shipment {shipment.TrackingNumber} already has an active Delivery Challan ({existingChallan.ChallanNumber}).");
        }

        string number = await GenerateDocumentNumberAsync("DC");

        var challan = new DeliveryChallan
        {
            ChallanNumber = number,
            ShipmentId = shipment.Id,
            SalesOrderId = salesOrder.Id,
            DistributorId = salesOrder.DistributorId,
            WarehouseId = null,
            IssueDate = DateTime.UtcNow,
            IssuedByUserId = userId,
            Carrier = string.IsNullOrWhiteSpace(dto.Carrier) ? shipment.CourierName : dto.Carrier,
            VehicleNumber = dto.VehicleNumber,
            DestinationAddress = string.IsNullOrWhiteSpace(dto.DestinationAddress) ? (salesOrder.ShippingAddress ?? "Standard Shipping Address") : dto.DestinationAddress,
            Status = DeliveryChallanStatus.Draft,
            Remarks = dto.Remarks
        };

        foreach (var itemDto in dto.Items)
        {
            var shipmentItem = shipment.ShipmentItems.FirstOrDefault(si => si.ProductId == itemDto.ProductId);
            if (shipmentItem != null && itemDto.Quantity > shipmentItem.Quantity)
            {
                throw new InvalidOperationException($"Challan quantity ({itemDto.Quantity}) for product {itemDto.ProductId} exceeds shipment item quantity ({shipmentItem.Quantity}).");
            }

            challan.Items.Add(new DeliveryChallanItem
            {
                ProductId = itemDto.ProductId,
                SalesOrderItemId = itemDto.SalesOrderItemId,
                BatchId = itemDto.BatchId,
                SerialNumberId = itemDto.SerialNumberId,
                Quantity = itemDto.Quantity,
                UnitOfMeasure = itemDto.UnitOfMeasure
            });
        }

        _context.DeliveryChallans.Add(challan);

        // Register Shipment Document Reference
        _context.ShipmentDocuments.Add(new ShipmentDocument
        {
            ShipmentId = shipment.Id,
            DocumentType = LogisticsDocumentType.DeliveryChallan,
            DocumentNumber = number,
            DocumentDate = DateTime.UtcNow,
            Status = "Draft",
            GeneratedByUserId = userId,
            DeliveryChallan = challan
        });

        await _context.SaveChangesAsync();

        if (userId.HasValue)
        {
            await _auditLogger.LogAsync("CreateDeliveryChallan", "DeliveryChallan", challan.Id.ToString(), "", $"Created Draft Delivery Challan {number}");
        }

        return (await GetDeliveryChallanByIdAsync(challan.Id))!;
    }

    public async Task<DeliveryChallanDto> UpdateDeliveryChallanAsync(Guid id, CreateDeliveryChallanDto dto, Guid? userId = null)
    {
        var challan = await _context.DeliveryChallans
            .Include(d => d.Items)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (challan == null)
            throw new InvalidOperationException($"Delivery Challan with ID {id} not found.");

        if (challan.Status != DeliveryChallanStatus.Draft)
            throw new InvalidOperationException($"Delivery Challan {challan.ChallanNumber} is {challan.Status} and cannot be modified.");

        challan.Carrier = dto.Carrier;
        challan.VehicleNumber = dto.VehicleNumber;
        challan.DestinationAddress = dto.DestinationAddress;
        challan.Remarks = dto.Remarks;

        _context.DeliveryChallanItems.RemoveRange(challan.Items);

        foreach (var itemDto in dto.Items)
        {
            challan.Items.Add(new DeliveryChallanItem
            {
                ProductId = itemDto.ProductId,
                SalesOrderItemId = itemDto.SalesOrderItemId,
                BatchId = itemDto.BatchId,
                SerialNumberId = itemDto.SerialNumberId,
                Quantity = itemDto.Quantity,
                UnitOfMeasure = itemDto.UnitOfMeasure
            });
        }

        await _context.SaveChangesAsync();

        if (userId.HasValue)
        {
            await _auditLogger.LogAsync("UpdateDeliveryChallan", "DeliveryChallan", challan.Id.ToString(), "", $"Updated Draft Delivery Challan {challan.ChallanNumber}");
        }

        return (await GetDeliveryChallanByIdAsync(challan.Id))!;
    }

    public async Task<DeliveryChallanDto> IssueDeliveryChallanAsync(Guid id, Guid? userId = null)
    {
        var challan = await _context.DeliveryChallans.FirstOrDefaultAsync(d => d.Id == id);
        if (challan == null)
            throw new InvalidOperationException($"Delivery Challan with ID {id} not found.");

        if (challan.Status == DeliveryChallanStatus.Issued)
            throw new InvalidOperationException($"Delivery Challan {challan.ChallanNumber} is already Issued.");

        if (challan.Status == DeliveryChallanStatus.Cancelled)
            throw new InvalidOperationException($"Cannot issue cancelled Delivery Challan {challan.ChallanNumber}.");

        challan.Status = DeliveryChallanStatus.Issued;

        var doc = await _context.ShipmentDocuments.FirstOrDefaultAsync(s => s.DeliveryChallanId == id);
        if (doc != null) doc.Status = "Issued";

        await _context.SaveChangesAsync();

        if (userId.HasValue)
        {
            await _auditLogger.LogAsync("IssueDeliveryChallan", "DeliveryChallan", challan.Id.ToString(), "", $"Officially Issued Delivery Challan {challan.ChallanNumber}");
        }

        return (await GetDeliveryChallanByIdAsync(challan.Id))!;
    }

    public async Task<DeliveryChallanDto> CancelDeliveryChallanAsync(Guid id, Guid? userId = null)
    {
        var challan = await _context.DeliveryChallans.FirstOrDefaultAsync(d => d.Id == id);
        if (challan == null)
            throw new InvalidOperationException($"Delivery Challan with ID {id} not found.");

        if (challan.Status == DeliveryChallanStatus.Cancelled)
            throw new InvalidOperationException($"Delivery Challan {challan.ChallanNumber} is already Cancelled.");

        challan.Status = DeliveryChallanStatus.Cancelled;

        var doc = await _context.ShipmentDocuments.FirstOrDefaultAsync(s => s.DeliveryChallanId == id);
        if (doc != null) doc.Status = "Cancelled";

        await _context.SaveChangesAsync();

        if (userId.HasValue)
        {
            await _auditLogger.LogAsync("CancelDeliveryChallan", "DeliveryChallan", challan.Id.ToString(), "", $"Cancelled Delivery Challan {challan.ChallanNumber}");
        }

        return (await GetDeliveryChallanByIdAsync(challan.Id))!;
    }

    // ==========================================
    // SHIPMENT DOCUMENTS
    // ==========================================
    public async Task<List<ShipmentDocumentDto>> GetShipmentDocumentsAsync(Guid shipmentId)
    {
        var docs = await _context.ShipmentDocuments
            .AsNoTracking()
            .Include(s => s.Shipment)
            .Include(s => s.CustomerInvoice)
            .Where(s => s.ShipmentId == shipmentId)
            .OrderByDescending(s => s.GeneratedAt)
            .ToListAsync();

        return docs.Select(d => new ShipmentDocumentDto
        {
            Id = d.Id,
            ShipmentId = d.ShipmentId,
            TrackingNumber = d.Shipment?.TrackingNumber ?? string.Empty,
            DocumentType = d.DocumentType,
            DocumentNumber = d.DocumentNumber,
            DocumentDate = d.DocumentDate,
            Status = d.Status,
            GeneratedAt = d.GeneratedAt,
            GeneratedByUserId = d.GeneratedByUserId,
            PackingListId = d.PackingListId,
            DeliveryChallanId = d.DeliveryChallanId,
            CustomerInvoiceId = d.CustomerInvoiceId,
            InvoiceNumber = d.CustomerInvoice?.InvoiceNumber,
            StorageReference = d.StorageReference
        }).ToList();
    }

    public async Task<ShipmentDocumentDto> GenerateShipmentDocumentReferenceAsync(
        Guid shipmentId,
        LogisticsDocumentType documentType,
        Guid? targetDocumentId = null,
        Guid? userId = null)
    {
        var shipment = await _context.Shipments.FirstOrDefaultAsync(s => s.Id == shipmentId);
        if (shipment == null)
            throw new InvalidOperationException($"Shipment with ID {shipmentId} not found.");

        string number = documentType switch
        {
            LogisticsDocumentType.PackingList => "PL-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-" + Guid.NewGuid().ToString("N").Substring(0, 4).ToUpper(),
            LogisticsDocumentType.DeliveryChallan => "DC-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-" + Guid.NewGuid().ToString("N").Substring(0, 4).ToUpper(),
            LogisticsDocumentType.CustomerInvoice => "INV-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-" + Guid.NewGuid().ToString("N").Substring(0, 4).ToUpper(),
            _ => "MAN-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-" + Guid.NewGuid().ToString("N").Substring(0, 4).ToUpper(),
        };

        var doc = new ShipmentDocument
        {
            ShipmentId = shipment.Id,
            DocumentType = documentType,
            DocumentNumber = number,
            DocumentDate = DateTime.UtcNow,
            Status = "Active",
            GeneratedByUserId = userId,
            PackingListId = documentType == LogisticsDocumentType.PackingList ? targetDocumentId : null,
            DeliveryChallanId = documentType == LogisticsDocumentType.DeliveryChallan ? targetDocumentId : null,
            CustomerInvoiceId = documentType == LogisticsDocumentType.CustomerInvoice ? targetDocumentId : null
        };

        _context.ShipmentDocuments.Add(doc);
        await _context.SaveChangesAsync();

        if (userId.HasValue)
        {
            await _auditLogger.LogAsync("GenerateShipmentDocument", "ShipmentDocument", doc.Id.ToString(), "", $"Generated {documentType} reference {number} for Shipment {shipment.TrackingNumber}");
        }

        return new ShipmentDocumentDto
        {
            Id = doc.Id,
            ShipmentId = doc.ShipmentId,
            TrackingNumber = shipment.TrackingNumber,
            DocumentType = doc.DocumentType,
            DocumentNumber = doc.DocumentNumber,
            DocumentDate = doc.DocumentDate,
            Status = doc.Status,
            GeneratedAt = doc.GeneratedAt,
            GeneratedByUserId = doc.GeneratedByUserId,
            PackingListId = doc.PackingListId,
            DeliveryChallanId = doc.DeliveryChallanId,
            CustomerInvoiceId = doc.CustomerInvoiceId,
            StorageReference = doc.StorageReference
        };
    }

    // ==========================================
    // HELPERS
    // ==========================================
    private async Task<string> GenerateDocumentNumberAsync(string prefix)
    {
        string datePart = DateTime.UtcNow.ToString("yyyyMMdd");
        string pattern = $"{prefix}-{datePart}-%";

        int maxSeq = 0;
        if (prefix == "PL")
        {
            var numbers = await _context.PackingLists
                .Where(p => EF.Functions.Like(p.PackingListNumber, pattern))
                .Select(p => p.PackingListNumber)
                .ToListAsync();

            maxSeq = ExtractMaxSeq(numbers);
        }
        else if (prefix == "DC")
        {
            var numbers = await _context.DeliveryChallans
                .Where(d => EF.Functions.Like(d.ChallanNumber, pattern))
                .Select(d => d.ChallanNumber)
                .ToListAsync();

            maxSeq = ExtractMaxSeq(numbers);
        }

        return $"{prefix}-{datePart}-{(maxSeq + 1):D4}";
    }

    private static int ExtractMaxSeq(List<string> numbers)
    {
        int maxSeq = 0;
        foreach (var num in numbers)
        {
            var parts = num.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[2], out int seq))
            {
                if (seq > maxSeq) maxSeq = seq;
            }
        }
        return maxSeq;
    }

    private static PackingListDto MapToPackingListDto(PackingList p)
    {
        return new PackingListDto
        {
            Id = p.Id,
            PackingListNumber = p.PackingListNumber,
            ShipmentId = p.ShipmentId,
            TrackingNumber = p.Shipment?.TrackingNumber ?? string.Empty,
            SalesOrderId = p.SalesOrderId,
            OrderNumber = p.SalesOrder?.OrderNumber ?? string.Empty,
            DistributorId = p.DistributorId,
            CustomerName = p.Customer?.CompanyName ?? string.Empty,
            WarehouseId = p.WarehouseId,
            WarehouseName = p.Warehouse?.WarehouseName,
            PackingDate = p.PackingDate,
            PackedByUserId = p.PackedByUserId,
            PackedByUserName = p.PackedByUser != null ? $"{p.PackedByUser.FirstName} {p.PackedByUser.LastName}".Trim() : null,
            TotalPackages = p.TotalPackages,
            TotalWeightKg = p.TotalWeightKg,
            PackageDimensions = p.PackageDimensions,
            Status = p.Status,
            Notes = p.Notes,
            CreatedAt = p.CreatedAt,
            Items = p.Items.Select(i => new PackingListItemDto
            {
                Id = i.Id,
                PackingListId = i.PackingListId,
                SalesOrderItemId = i.SalesOrderItemId,
                ProductId = i.ProductId,
                ProductCode = i.Product?.ProductCode ?? string.Empty,
                ProductName = i.Product?.Name ?? string.Empty,
                BatchId = i.BatchId,
                BatchNumber = i.Batch?.BatchNumber,
                SerialNumberId = i.SerialNumberId,
                SerialNumberText = i.SerialNumber?.SerialNumber,
                Quantity = i.Quantity,
                PackageNumber = i.PackageNumber,
                Description = i.Description
            }).ToList()
        };
    }

    private static DeliveryChallanDto MapToDeliveryChallanDto(DeliveryChallan d)
    {
        return new DeliveryChallanDto
        {
            Id = d.Id,
            ChallanNumber = d.ChallanNumber,
            ShipmentId = d.ShipmentId,
            TrackingNumber = d.Shipment?.TrackingNumber ?? string.Empty,
            SalesOrderId = d.SalesOrderId,
            OrderNumber = d.SalesOrder?.OrderNumber ?? string.Empty,
            DistributorId = d.DistributorId,
            CustomerName = d.Customer?.CompanyName ?? string.Empty,
            WarehouseId = d.WarehouseId,
            WarehouseName = d.Warehouse?.WarehouseName,
            IssueDate = d.IssueDate,
            IssuedByUserId = d.IssuedByUserId,
            IssuedByUserName = d.IssuedByUser != null ? $"{d.IssuedByUser.FirstName} {d.IssuedByUser.LastName}".Trim() : null,
            Carrier = d.Carrier,
            VehicleNumber = d.VehicleNumber,
            DestinationAddress = d.DestinationAddress,
            Status = d.Status,
            Remarks = d.Remarks,
            CreatedAt = d.CreatedAt,
            Items = d.Items.Select(i => new DeliveryChallanItemDto
            {
                Id = i.Id,
                DeliveryChallanId = i.DeliveryChallanId,
                ProductId = i.ProductId,
                ProductCode = i.Product?.ProductCode ?? string.Empty,
                ProductName = i.Product?.Name ?? string.Empty,
                SalesOrderItemId = i.SalesOrderItemId,
                BatchId = i.BatchId,
                BatchNumber = i.Batch?.BatchNumber,
                SerialNumberId = i.SerialNumberId,
                SerialNumberText = i.SerialNumber?.SerialNumber,
                Quantity = i.Quantity,
                UnitOfMeasure = i.UnitOfMeasure
            }).ToList()
        };
    }
}
