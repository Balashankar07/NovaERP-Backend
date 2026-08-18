using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Models;

using NovaERP.Application.DTOs.Procurement;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;
using NovaERP.Application.Common.Exceptions;

namespace NovaERP.Infrastructure.Services;

public class PurchaseRequestService : IPurchaseRequestService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;
    private readonly ICurrentUserService _currentUserService;

    public PurchaseRequestService(IUnitOfWork unitOfWork, IAuditLogger auditLogger, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<PurchaseRequestDto>> GetAllAsync(int pageNumber, int pageSize, string? search, string? sortBy, string? sortOrder, string? status, string? priority, string? source)
    {
        var query = _unitOfWork.PurchaseRequests.GetQueryable()
            .Include(x => x.Items)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(x => 
                x.RequestNumber.ToLower().Contains(search) || 
                x.RequestedBy.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PurchaseRequestStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(x => x.Status == parsedStatus);
        }

        if (!string.IsNullOrWhiteSpace(priority) && Enum.TryParse<PurchaseRequestPriority>(priority, true, out var parsedPriority))
        {
            query = query.Where(x => x.Priority == parsedPriority);
        }

        if (!string.IsNullOrWhiteSpace(source) && Enum.TryParse<PurchaseRequestSource>(source, true, out var parsedSource))
        {
            query = query.Where(x => x.Source == parsedSource);
        }

        bool isDesc = sortOrder?.Equals("desc", StringComparison.OrdinalIgnoreCase) ?? true;
        
        query = (sortBy?.ToLower()) switch
        {
            "requestnumber" => isDesc ? query.OrderByDescending(x => x.RequestNumber) : query.OrderBy(x => x.RequestNumber),
            "requestdate" => isDesc ? query.OrderByDescending(x => x.RequestDate) : query.OrderBy(x => x.RequestDate),
            "requiredbydate" => isDesc ? query.OrderByDescending(x => x.RequiredByDate) : query.OrderBy(x => x.RequiredByDate),
            _ => isDesc ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt),
        };

        var totalCount = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<PurchaseRequestDto>
        {
            Items = items.Select(MapToDto).ToList(), 
            TotalCount = totalCount, 
            PageNumber = pageNumber, 
            PageSize = pageSize
        };
    }

    public async Task<PurchaseRequestDto> GetByIdAsync(Guid id)
    {
        var pr = await _unitOfWork.PurchaseRequests.GetByIdWithItemsAsync(id);
        if (pr == null) throw new KeyNotFoundException($"PurchaseRequest {id} not found.");
        return MapToDto(pr);
    }

    public async Task<PurchaseRequestDto> CreateAsync(CreatePurchaseRequestDto dto)
    {
        if (dto.RequiredByDate < DateTime.UtcNow.Date)
            throw new BadRequestException("Required By Date cannot be in the past.");

        if (!dto.Items.Any())
            throw new BadRequestException("Purchase Request must contain at least one item.");

        var currentUser = _currentUserService.Email;
        var currentUserId = _currentUserService.UserId;

        var pr = new PurchaseRequest
        {
            RequestNumber = await _unitOfWork.PurchaseRequests.GeneratePRNumberAsync(),
            RequestedBy = currentUser ?? "System",
            Department = "Procurement", // Or get from user profile if exists
            RequestDate = DateTime.UtcNow,
            RequiredByDate = dto.RequiredByDate,
            Priority = dto.Priority,
            Reason = dto.Reason,
            Status = PurchaseRequestStatus.Draft,
            Source = dto.Source,
            SourceReferenceId = dto.SourceReferenceId,
        };

        foreach (var itemDto in dto.Items)
        {
            if (itemDto.RequestedQuantity <= 0)
                throw new BadRequestException("Requested quantity must be greater than 0.");

            var product = await _unitOfWork.Products.GetByIdAsync(itemDto.ProductId);
            if (product == null || !product.IsActive)
                throw new BadRequestException($"Product {itemDto.ProductId} is invalid or inactive.");

            if (product.Type != ProductType.Component)
                throw new BadRequestException("Only Component products can be requested.");

            pr.Items.Add(new PurchaseRequestItem
            {
                ProductId = itemDto.ProductId,
                Product = product, // mapped locally to be available in DTO mapped return
                RequestedQuantity = itemDto.RequestedQuantity,
                ApprovedQuantity = 0,
                ConvertedQuantity = 0,
                Remarks = itemDto.Remarks
            });
        }

        await _unitOfWork.PurchaseRequests.AddAsync(pr);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Create", "PurchaseRequest", pr.Id.ToString(), newValues: $"RequestNumber: {pr.RequestNumber}, Source: {pr.Source}");

        return MapToDto(pr);
    }

    public async Task<PurchaseRequestDto> UpdateAsync(Guid id, UpdatePurchaseRequestDto dto)
    {
        var pr = await _unitOfWork.PurchaseRequests.GetByIdWithItemsAsync(id);
        if (pr == null) throw new KeyNotFoundException("Purchase Request not found.");

        if (pr.Status != PurchaseRequestStatus.Draft)
            throw new BadRequestException("Only Draft Purchase Requests can be edited.");

        if (dto.RequiredByDate < DateTime.UtcNow.Date)
            throw new BadRequestException("Required By Date cannot be in the past.");

        pr.RequiredByDate = dto.RequiredByDate;
        pr.Priority = dto.Priority;
        pr.Reason = dto.Reason;

        // Sync items
        var incomingProductIds = dto.Items.Select(i => i.ProductId).ToList();
        var itemsToRemove = pr.Items.Where(i => !incomingProductIds.Contains(i.ProductId)).ToList();
        foreach (var item in itemsToRemove)
            pr.Items.Remove(item);

        foreach (var itemDto in dto.Items)
        {
            if (itemDto.RequestedQuantity <= 0)
                throw new BadRequestException("Requested quantity must be greater than 0.");

            var existingItem = pr.Items.FirstOrDefault(i => i.ProductId == itemDto.ProductId);
            if (existingItem != null)
            {
                existingItem.RequestedQuantity = itemDto.RequestedQuantity;
                existingItem.Remarks = itemDto.Remarks;
            }
            else
            {
                var product = await _unitOfWork.Products.GetByIdAsync(itemDto.ProductId);
                if (product == null || !product.IsActive)
                    throw new BadRequestException($"Product {itemDto.ProductId} is invalid or inactive.");

                if (product.Type != ProductType.Component)
                    throw new BadRequestException("Only Component products can be requested.");

                pr.Items.Add(new PurchaseRequestItem
                {
                    ProductId = itemDto.ProductId,
                    Product = product,
                    RequestedQuantity = itemDto.RequestedQuantity,
                    ApprovedQuantity = 0,
                    ConvertedQuantity = 0,
                    Remarks = itemDto.Remarks
                });
            }
        }

        if (!pr.Items.Any())
            throw new BadRequestException("Purchase Request must contain at least one item.");

        _unitOfWork.PurchaseRequests.Update(pr);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Update", "PurchaseRequest", pr.Id.ToString());

        return MapToDto(pr);
    }

    public async Task DeleteAsync(Guid id)
    {
        var pr = await _unitOfWork.PurchaseRequests.GetByIdWithItemsAsync(id);
        if (pr == null) return;

        if (pr.Status != PurchaseRequestStatus.Draft)
            throw new BadRequestException("Only Draft Purchase Requests can be deleted.");

        _unitOfWork.PurchaseRequests.Delete(pr);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Delete", "PurchaseRequest", pr.Id.ToString(), oldValues: $"RequestNumber: {pr.RequestNumber}");
    }

    public async Task<PurchaseRequestDto> SubmitAsync(Guid id)
    {
        var pr = await _unitOfWork.PurchaseRequests.GetByIdWithItemsAsync(id);
        if (pr == null) throw new KeyNotFoundException("Purchase Request not found.");

        if (pr.Status != PurchaseRequestStatus.Draft)
            throw new BadRequestException("Only Draft Purchase Requests can be submitted.");

        if (!pr.Items.Any())
            throw new BadRequestException("Purchase Request must contain at least one item.");

        pr.Status = PurchaseRequestStatus.PendingApproval;
        
        _unitOfWork.PurchaseRequests.Update(pr);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("StatusChange", "PurchaseRequest", pr.Id.ToString(), oldValues: "Draft", newValues: "PendingApproval");

        return MapToDto(pr);
    }

    public async Task<PurchaseRequestDto> ApproveAsync(Guid id)
    {
        var pr = await _unitOfWork.PurchaseRequests.GetByIdWithItemsAsync(id);
        if (pr == null) throw new KeyNotFoundException("Purchase Request not found.");

        if (pr.Status != PurchaseRequestStatus.PendingApproval)
            throw new BadRequestException("Only PendingApproval Purchase Requests can be approved.");

        var currentUser = _currentUserService.Email;

        pr.Status = PurchaseRequestStatus.Approved;
        pr.ApprovedBy = currentUser ?? "System";
        pr.ApprovedAt = DateTime.UtcNow;

        foreach (var item in pr.Items)
        {
            item.ApprovedQuantity = item.RequestedQuantity;
        }
        
        _unitOfWork.PurchaseRequests.Update(pr);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("StatusChange", "PurchaseRequest", pr.Id.ToString(), oldValues: "PendingApproval", newValues: "Approved");

        return MapToDto(pr);
    }

    public async Task<PurchaseRequestDto> RejectAsync(Guid id, RejectPurchaseRequestDto dto)
    {
        var pr = await _unitOfWork.PurchaseRequests.GetByIdWithItemsAsync(id);
        if (pr == null) throw new KeyNotFoundException("Purchase Request not found.");

        if (pr.Status != PurchaseRequestStatus.PendingApproval)
            throw new BadRequestException("Only PendingApproval Purchase Requests can be rejected.");

        if (string.IsNullOrWhiteSpace(dto.RejectionReason))
            throw new BadRequestException("Rejection reason is required.");

        pr.Status = PurchaseRequestStatus.Rejected;
        pr.RejectionReason = dto.RejectionReason;
        
        _unitOfWork.PurchaseRequests.Update(pr);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("StatusChange", "PurchaseRequest", pr.Id.ToString(), oldValues: "PendingApproval", newValues: "Rejected");

        return MapToDto(pr);
    }

    public async Task<PurchaseRequestDto> CancelAsync(Guid id)
    {
        var pr = await _unitOfWork.PurchaseRequests.GetByIdWithItemsAsync(id);
        if (pr == null) throw new KeyNotFoundException("Purchase Request not found.");

        if (pr.Status != PurchaseRequestStatus.Draft)
            throw new BadRequestException("Only Draft Purchase Requests can be cancelled.");

        pr.Status = PurchaseRequestStatus.Cancelled;
        
        _unitOfWork.PurchaseRequests.Update(pr);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("StatusChange", "PurchaseRequest", pr.Id.ToString(), oldValues: "Draft", newValues: "Cancelled");

        return MapToDto(pr);
    }

    private PurchaseRequestDto MapToDto(PurchaseRequest pr)
    {
        return new PurchaseRequestDto
        {
            Id = pr.Id,
            RequestNumber = pr.RequestNumber,
            RequestedBy = pr.RequestedBy,
            Department = pr.Department,
            RequestDate = pr.RequestDate,
            RequiredByDate = pr.RequiredByDate,
            Priority = pr.Priority,
            Reason = pr.Reason,
            Status = pr.Status,
            ApprovedBy = pr.ApprovedBy,
            ApprovedAt = pr.ApprovedAt,
            RejectionReason = pr.RejectionReason,
            Source = pr.Source,
            SourceReferenceId = pr.SourceReferenceId,
            CreatedAt = pr.CreatedAt,
            UpdatedAt = pr.UpdatedAt,
            Items = pr.Items.Select(i => new PurchaseRequestItemDto
            {
                Id = i.Id,
                PurchaseRequestId = i.PurchaseRequestId,
                ProductId = i.ProductId,
                ProductCode = i.Product?.ProductCode ?? string.Empty,
                ProductNumber = i.Product?.ProductNumber ?? string.Empty,
                ProductName = i.Product?.Name ?? string.Empty,
                RequestedQuantity = i.RequestedQuantity,
                ApprovedQuantity = i.ApprovedQuantity,
                ConvertedQuantity = i.ConvertedQuantity,
                RemainingQuantity = i.RemainingQuantity,
                Remarks = i.Remarks
            }).ToList()
        };
    }
}
