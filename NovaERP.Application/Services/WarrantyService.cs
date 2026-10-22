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

    public async Task<WarrantyDto> CreateWarrantyAsync(CreateWarrantyDto request)
    {
        // Validate Product
        var product = await _unitOfWork.Products.GetByIdAsync(request.ProductId);
        if (product == null)
            throw new BadRequestException("Invalid Product ID.");

        // Validate Shipment and Ensure it is Delivered
        var shipment = await _unitOfWork.Shipments.GetByIdAsync(request.ShipmentId);
        if (shipment == null)
            throw new BadRequestException("Invalid Shipment ID.");
        
        if (shipment.Status != ShipmentStatus.Delivered)
            throw new BadRequestException("Warranty can only be created from Delivered Shipments.");

        if (request.EndDate < request.StartDate)
            throw new BadRequestException("End Date cannot be before Start Date.");

        var duplicateExists = await _unitOfWork.Warranties.ExistsForProductAndShipmentAsync(request.ProductId, request.ShipmentId);
        if (duplicateExists)
            throw new ConflictException("Warranty already exists for this product and shipment.");

        // Check Serial Number Uniqueness
        var exists = await _unitOfWork.Warranties.ExistsBySerialNumberAsync(request.SerialNumber);
        if (exists)
            throw new ConflictException("Warranty with this Serial Number already exists.");

        var warranty = new Warranty
        {
            ProductId = request.ProductId,
            ShipmentId = request.ShipmentId,
            SerialNumber = request.SerialNumber,
            WarrantyType = request.WarrantyType,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Status = WarrantyStatus.Active
        };

        await _unitOfWork.Warranties.AddAsync(warranty);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Create", "Warranty", warranty.Id.ToString());

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
        ShipmentId = warranty.ShipmentId,
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
