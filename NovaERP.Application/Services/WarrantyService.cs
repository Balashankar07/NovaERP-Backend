using NovaERP.Application.Common.Exceptions;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Warranties.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;

namespace NovaERP.Application.Services;

public class WarrantyService : IWarrantyService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;
    private readonly INotificationService _notificationService;

    public WarrantyService(IUnitOfWork unitOfWork, IAuditLogger auditLogger, INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
        _notificationService = notificationService;
    }

    public async Task<WarrantyDto> GetWarrantyByIdAsync(Guid id)
    {
        var warranty = await _unitOfWork.Warranties.GetByIdAsync(id);
        if (warranty == null)
            throw new KeyNotFoundException($"Warranty with ID {id} not found.");

        return MapToDto(warranty);
    }

    public async Task<PagedResult<WarrantyDto>> GetAllWarrantiesAsync(int pageNumber, int pageSize, string? search, string? sortBy, string? sortOrder)
    {
        var result = await _unitOfWork.Warranties.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        
        return new PagedResult<WarrantyDto>
        {
            Items = result.Items.Select(MapToDto).ToList(),
            TotalCount = result.TotalCount,
            PageNumber = result.PageNumber,
            PageSize = result.PageSize
        };
    }

    public async Task<List<EligibleShipmentDto>> GetEligibleShipmentsAsync()
    {
        var deliveredShipments = await _unitOfWork.Shipments.GetDeliveredShipmentsWithDetailsAsync();
        var result = new List<EligibleShipmentDto>();

        foreach (var s in deliveredShipments)
        {
            var items = new List<EligibleShipmentItemDto>();
            foreach (var si in s.ShipmentItems)
            {
                var registeredCount = await _unitOfWork.Warranties.GetCountForProductAndShipmentAsync(si.ProductId, s.Id);
                items.Add(new EligibleShipmentItemDto
                {
                    Id = si.Id,
                    ProductId = si.ProductId,
                    ProductName = si.Product?.Name ?? "Product",
                    ProductCode = si.Product?.ProductCode,
                    SKU = si.Product?.SKU,
                    Quantity = si.Quantity,
                    RegisteredWarrantyCount = registeredCount,
                    RemainingEligibleQuantity = Math.Max(0m, si.Quantity - registeredCount)
                });
            }

            result.Add(new EligibleShipmentDto
            {
                Id = s.Id,
                TrackingNumber = s.TrackingNumber,
                CourierName = s.CourierName,
                DeliveryDate = s.DeliveryDate,
                OrderNumber = s.SalesOrder?.OrderNumber,
                CustomerName = s.SalesOrder?.Distributor?.CompanyName,
                Items = items
            });
        }

        return result;
    }

    public static string GetProductPrefix(string? productCode, string? productName = null)
    {
        if (string.IsNullOrWhiteSpace(productCode))
        {
            if (!string.IsNullOrWhiteSpace(productName))
            {
                var words = productName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var initials = string.Concat(words.Where(w => char.IsLetterOrDigit(w[0])).Take(3).Select(w => char.ToUpper(w[0])));
                if (!string.IsNullOrEmpty(initials)) return initials;
            }
            return "GEN";
        }

        var parts = productCode.Split(new[] { '-', '_', ' ' }, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 1)
        {
            return parts[0].ToUpperInvariant();
        }

        // Filter out category/type prefixes like FG, PRD, CMP, RAW, SKU if there are other descriptive tokens
        var candidate = parts.FirstOrDefault(p =>
            !p.Equals("FG", StringComparison.OrdinalIgnoreCase) &&
            !p.Equals("PRD", StringComparison.OrdinalIgnoreCase) &&
            !p.Equals("CMP", StringComparison.OrdinalIgnoreCase) &&
            !p.Equals("RAW", StringComparison.OrdinalIgnoreCase) &&
            !p.Equals("SKU", StringComparison.OrdinalIgnoreCase) &&
            !int.TryParse(p, out _));

        if (!string.IsNullOrEmpty(candidate))
        {
            return candidate.ToUpperInvariant();
        }

        var nonNumeric = parts.FirstOrDefault(p => !int.TryParse(p, out _));
        return (nonNumeric ?? parts[0]).ToUpperInvariant();
    }

    public async Task<string> GetNextSerialNumberAsync(Guid productId)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(productId);
        if (product == null)
            throw new BadRequestException("Invalid Product ID.");

        var prefix = GetProductPrefix(product.ProductCode, product.Name);
        var maxInDb = await _unitOfWork.Warranties.GetMaxSequenceNumberForPrefixAsync(prefix);
        var peek = await _unitOfWork.Warranties.PeekNextSequenceValueAsync(prefix, maxInDb + 1);
        var nextSeq = Math.Max(maxInDb + 1, peek);

        return $"SN-{prefix}-{nextSeq:D6}";
    }

    public async Task<WarrantyDto> CreateWarrantyAsync(CreateWarrantyDto request)
    {
        // 1. Validate Product
        var product = await _unitOfWork.Products.GetByIdAsync(request.ProductId);
        if (product == null)
            throw new BadRequestException("Invalid Product ID.");

        var prefix = GetProductPrefix(product.ProductCode, product.Name);
        var serialTrimmed = request.SerialNumber?.Trim() ?? string.Empty;

        // 2. Validate Serial Number Uniqueness if provided
        if (!string.IsNullOrWhiteSpace(serialTrimmed))
        {
            var exists = await _unitOfWork.Warranties.ExistsBySerialNumberAsync(serialTrimmed);
            if (exists)
                throw new ConflictException($"Warranty with Serial Number '{serialTrimmed}' already exists.");
        }

        // 3. Validate Shipment with Details and Ensure it is Delivered
        var shipment = await _unitOfWork.Shipments.GetShipmentWithDetailsAsync(request.ShipmentId);
        if (shipment == null)
            throw new BadRequestException("Invalid Shipment ID.");
        
        if (shipment.Status != ShipmentStatus.Delivered)
            throw new BadRequestException("Warranty can only be created from Delivered Shipments.");

        // 4. Validate Product/Shipment Association
        var shipmentItem = shipment.ShipmentItems.FirstOrDefault(si => si.ProductId == request.ProductId);
        if (shipmentItem == null)
            throw new BadRequestException("The specified product is not part of this delivered shipment.");

        // 5. Validate Dates
        if (request.EndDate < request.StartDate)
            throw new BadRequestException("End Date cannot be before Start Date.");

        // 6. Validate Unit Quantity & Duplicate Registrations
        var registeredCount = await _unitOfWork.Warranties.GetCountForProductAndShipmentAsync(request.ProductId, request.ShipmentId);
        if (registeredCount >= shipmentItem.Quantity)
            throw new ConflictException($"All {shipmentItem.Quantity} unit(s) for product '{shipmentItem.Product?.Name ?? product.Name}' in shipment {shipment.TrackingNumber} already have registered warranties. A warranty already exists for all delivered units.");

        // 7. Auto-allocate Serial Number if not provided
        if (string.IsNullOrWhiteSpace(serialTrimmed))
        {
            var maxInDb = await _unitOfWork.Warranties.GetMaxSequenceNumberForPrefixAsync(prefix);
            var nextSeq = await _unitOfWork.Warranties.GetNextSequenceValueAsync(prefix, maxInDb + 1);
            serialTrimmed = $"SN-{prefix}-{nextSeq:D6}";

            while (await _unitOfWork.Warranties.ExistsBySerialNumberAsync(serialTrimmed))
            {
                nextSeq = await _unitOfWork.Warranties.GetNextSequenceValueAsync(prefix, nextSeq + 1);
                serialTrimmed = $"SN-{prefix}-{nextSeq:D6}";
            }
        }
        else
        {
            // If provided serial matches sequence pattern, keep database sequence advanced past it
            var parts = serialTrimmed.Split('-');
            if (parts.Length == 3 && parts[1].Equals(prefix, StringComparison.OrdinalIgnoreCase) && long.TryParse(parts[2], out var providedSeq))
            {
                await _unitOfWork.Warranties.SetSequenceValueIfLowerAsync(prefix, providedSeq + 1);
            }
        }

        var warranty = new Warranty
        {
            ProductId = request.ProductId,
            ShipmentId = request.ShipmentId,
            SerialNumber = serialTrimmed,
            WarrantyType = request.WarrantyType,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Status = WarrantyStatus.Active
        };

        await _unitOfWork.Warranties.AddAsync(warranty);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Create", "Warranty", warranty.Id.ToString());

        warranty.Product = product;
        warranty.Shipment = shipment;

        return MapToDto(warranty);
    }

    public async Task<WarrantyDto> UpdateWarrantyAsync(Guid id, UpdateWarrantyDto request)
    {
        var warranty = await _unitOfWork.Warranties.GetByIdAsync(id);
        if (warranty == null)
            throw new KeyNotFoundException($"Warranty with ID {id} not found.");

        if (warranty.Status == WarrantyStatus.Closed)
            throw new BadRequestException("Closed warranties are immutable.");



        if (request.Status.HasValue)
        {
            warranty.Status = request.Status.Value;
        }

        _unitOfWork.Warranties.Update(warranty);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Update", "Warranty", warranty.Id.ToString());

        return MapToDto(warranty);
    }

    public async Task DeleteWarrantyAsync(Guid id)
    {
        var warranty = await _unitOfWork.Warranties.GetByIdAsync(id);
        if (warranty == null)
            throw new KeyNotFoundException($"Warranty with ID {id} not found.");

        if (warranty.Status == WarrantyStatus.Closed)
            throw new BadRequestException("Closed warranties are immutable.");

        _unitOfWork.Warranties.Delete(warranty);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<WarrantyClaimDto> GetClaimByIdAsync(Guid claimId)
    {
        var claim = await _unitOfWork.WarrantyClaims.GetByIdAsync(claimId);
        if (claim == null)
            throw new KeyNotFoundException($"Warranty Claim with ID {claimId} not found.");

        return MapClaimToDto(claim);
    }

    public async Task<PagedResult<WarrantyClaimDto>> GetAllClaimsAsync(int pageNumber, int pageSize, string? search, string? sortBy, string? sortOrder)
    {
        var result = await _unitOfWork.WarrantyClaims.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        
        return new PagedResult<WarrantyClaimDto>
        {
            Items = result.Items.Select(MapClaimToDto).ToList(),
            TotalCount = result.TotalCount,
            PageNumber = result.PageNumber,
            PageSize = result.PageSize
        };
    }

    public async Task<WarrantyClaimDto> CreateClaimAsync(CreateWarrantyClaimDto request)
    {
        var warranty = await _unitOfWork.Warranties.GetByIdAsync(request.WarrantyId);
        if (warranty == null)
            throw new BadRequestException("Invalid Warranty ID.");

        if (warranty.Status == WarrantyStatus.Closed)
            throw new BadRequestException("Cannot create a claim on a Closed warranty.");

        if (warranty.Status == WarrantyStatus.Expired)
            throw new BadRequestException("Expired warranties reject new claims.");

        if (warranty.Status != WarrantyStatus.Active)
            throw new BadRequestException("Claims are only allowed on Active Warranties.");

        var claim = new WarrantyClaim
        {
            WarrantyId = request.WarrantyId,
            Complaint = request.Complaint,
            RequestDate = DateTime.UtcNow,
            Status = WarrantyClaimStatus.Pending
        };

        await _unitOfWork.WarrantyClaims.AddAsync(claim);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Create", "WarrantyClaim", claim.Id.ToString());

        try
        {
            var serial = string.IsNullOrWhiteSpace(warranty.SerialNumber) ? warranty.Id.ToString()[..8] : warranty.SerialNumber;
            await _notificationService.NotifyRoleUsersAsync(
                "Quality Engineer",
                NotificationType.WarrantyAlert,
                $"New Warranty Claim: SN {serial}",
                $"Customer claim registered on warranty for Serial #{serial}: {claim.Complaint}. Review for defect evaluation.",
                NotificationPriority.High,
                "WarrantyClaim", claim.Id.ToString(),
                $"/warranty",
                $"claim-qa-{claim.Id}"
            );

            await _notificationService.NotifyRoleUsersAsync(
                "Warehouse Manager",
                NotificationType.ReturnAlert,
                $"Warranty Return Alert: SN {serial}",
                $"Customer filed warranty claim for Serial #{serial}. Prepare for potential RMA return receiving.",
                NotificationPriority.Normal,
                "WarrantyClaim", claim.Id.ToString(),
                $"/distribution",
                $"claim-wh-{claim.Id}"
            );
        }
        catch { /* Non-critical */ }

        return MapClaimToDto(claim);
    }

    public async Task<WarrantyClaimDto> UpdateClaimAsync(Guid claimId, UpdateWarrantyClaimDto request)
    {
        var claim = await _unitOfWork.WarrantyClaims.GetByIdAsync(claimId);
        if (claim == null)
            throw new KeyNotFoundException($"Warranty Claim with ID {claimId} not found.");

        if (claim.Status == WarrantyClaimStatus.Closed)
            throw new BadRequestException("Closed claims are immutable.");

        if (request.Status.HasValue)
        {
            if (claim.Status == WarrantyClaimStatus.Resolved && request.Status == WarrantyClaimStatus.Resolved)
                throw new BadRequestException("Claim is already resolved.");

            claim.Status = request.Status.Value;
        }
        
        if (request.Resolution != null)
        {
            claim.Resolution = request.Resolution;
        }

        _unitOfWork.WarrantyClaims.Update(claim);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Update", "WarrantyClaim", claim.Id.ToString());

        return MapClaimToDto(claim);
    }

    private static WarrantyDto MapToDto(Warranty warranty) => new()
    {
        Id = warranty.Id,
        ProductId = warranty.ProductId,
        ProductName = warranty.Product?.Name,
        ProductCode = warranty.Product?.ProductCode,
        ShipmentId = warranty.ShipmentId,
        TrackingNumber = warranty.Shipment?.TrackingNumber,
        SerialNumber = warranty.SerialNumber,
        WarrantyType = warranty.WarrantyType,
        StartDate = warranty.StartDate,
        EndDate = warranty.EndDate,
        Status = warranty.Status,
        CreatedAt = warranty.CreatedAt
    };

    private static WarrantyClaimDto MapClaimToDto(WarrantyClaim claim) => new()
    {
        Id = claim.Id,
        WarrantyId = claim.WarrantyId,
        Complaint = claim.Complaint,
        RequestDate = claim.RequestDate,
        Resolution = claim.Resolution,
        Status = claim.Status,
        CreatedAt = claim.CreatedAt
    };
}
