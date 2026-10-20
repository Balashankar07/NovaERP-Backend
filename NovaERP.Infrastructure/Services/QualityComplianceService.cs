using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Exceptions;
using NovaERP.Application.Common.Models;
using NovaERP.Application.DTOs.QualityCompliance;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Services;

public class QualityComplianceService : IQualityComplianceService
{
    private readonly AppDbContext _context;
    private readonly IAuditLogger _auditLogger;
    private readonly IInventoryMovementService _inventoryMovementService;

    public QualityComplianceService(
        AppDbContext context,
        IAuditLogger auditLogger,
        IInventoryMovementService inventoryMovementService)
    {
        _context = context;
        _auditLogger = auditLogger;
        _inventoryMovementService = inventoryMovementService;
    }

    // ==========================================
    // STAGE A — NON-CONFORMANCE REPORT (NCR)
    // ==========================================
    public async Task<PagedResult<NonConformanceReportDto>> GetNcrsAsync(
        int pageNumber = 1,
        int pageSize = 10,
        string? search = null,
        NcrStatus? status = null,
        NcrSeverity? severity = null)
    {
        var query = _context.NonConformanceReports
            .Include(n => n.QualityInspection)
            .Include(n => n.ProductionExecution)
            .Include(n => n.Product)
            .Include(n => n.Batch)
            .Include(n => n.SerialNumber)
            .Include(n => n.ReportedByUser)
            .Include(n => n.AssignedToUser)
            .AsNoTracking();

        if (status.HasValue)
        {
            query = query.Where(n => n.Status == status.Value);
        }

        if (severity.HasValue)
        {
            query = query.Where(n => n.Severity == severity.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(n =>
                n.NcrNumber.ToLower().Contains(s) ||
                n.Category.ToLower().Contains(s) ||
                n.Description.ToLower().Contains(s) ||
                n.Product!.ProductCode.ToLower().Contains(s) ||
                n.Product.Name.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<NonConformanceReportDto>
        {
            Items = items.Select(MapToNcrDto).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<NonConformanceReportDto> GetNcrByIdAsync(Guid id)
    {
        var ncr = await _context.NonConformanceReports
            .Include(n => n.QualityInspection)
            .Include(n => n.ProductionExecution)
            .Include(n => n.Product)
            .Include(n => n.Batch)
            .Include(n => n.SerialNumber)
            .Include(n => n.ReportedByUser)
            .Include(n => n.AssignedToUser)
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == id);

        if (ncr == null)
            throw new KeyNotFoundException($"NCR with ID {id} was not found.");

        return MapToNcrDto(ncr);
    }

    public async Task<NonConformanceReportDto> CreateNcrAsync(CreateNcrDto dto, Guid currentUserId)
    {
        var inspection = await _context.QualityInspections
            .FirstOrDefaultAsync(q => q.Id == dto.QualityInspectionId);
        if (inspection == null)
            throw new KeyNotFoundException($"Quality Inspection with ID {dto.QualityInspectionId} was not found.");

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == dto.ProductId);
        if (product == null)
            throw new KeyNotFoundException($"Product with ID {dto.ProductId} was not found.");

        if (dto.ProductionExecutionId.HasValue)
        {
            var executionExists = await _context.ProductionExecutions.AnyAsync(pe => pe.Id == dto.ProductionExecutionId.Value);
            if (!executionExists)
                throw new KeyNotFoundException($"Production Execution with ID {dto.ProductionExecutionId.Value} was not found.");
        }

        if (dto.AssignedToUserId.HasValue)
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == dto.AssignedToUserId.Value && u.IsActive);
            if (!userExists)
                throw new BadRequestException($"Assigned user {dto.AssignedToUserId.Value} is not an active user.");
        }

        string ncrNumber = $"NCR-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..4].ToUpper()}";

        var ncr = new NonConformanceReport
        {
            Id = Guid.NewGuid(),
            NcrNumber = ncrNumber,
            QualityInspectionId = dto.QualityInspectionId,
            ProductionExecutionId = dto.ProductionExecutionId,
            ProductId = dto.ProductId,
            BatchId = dto.BatchId,
            SerialNumberId = dto.SerialNumberId,
            ReportedByUserId = currentUserId,
            AssignedToUserId = dto.AssignedToUserId,
            Severity = dto.Severity,
            Category = string.IsNullOrWhiteSpace(dto.Category) ? "Defect" : dto.Category.Trim(),
            Description = dto.Description.Trim(),
            DetectedDate = DateTime.UtcNow,
            Status = NcrStatus.Open,
            ContainmentAction = dto.ContainmentAction?.Trim(),
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _context.NonConformanceReports.AddAsync(ncr);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Create", "NonConformanceReport", ncr.Id.ToString(), newValues: $"NCR {ncrNumber} created with Severity {dto.Severity}");

        return await GetNcrByIdAsync(ncr.Id);
    }

    public async Task<NonConformanceReportDto> UpdateNcrAsync(Guid id, UpdateNcrDto dto, Guid currentUserId)
    {
        var ncr = await _context.NonConformanceReports.FirstOrDefaultAsync(n => n.Id == id);
        if (ncr == null)
            throw new KeyNotFoundException($"NCR with ID {id} was not found.");

        if (ncr.Status == NcrStatus.Closed || ncr.Status == NcrStatus.Cancelled)
            throw new BadRequestException("Closed or Cancelled NCR cannot be edited.");

        ncr.Severity = dto.Severity;
        if (!string.IsNullOrWhiteSpace(dto.Category)) ncr.Category = dto.Category.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Description)) ncr.Description = dto.Description.Trim();
        ncr.ContainmentAction = dto.ContainmentAction?.Trim();
        ncr.RootCauseCategory = dto.RootCauseCategory?.Trim();
        ncr.RootCauseDescription = dto.RootCauseDescription?.Trim();
        ncr.CorrectiveAction = dto.CorrectiveAction?.Trim();
        ncr.PreventiveAction = dto.PreventiveAction?.Trim();
        ncr.UpdatedBy = currentUserId;
        ncr.UpdatedAt = DateTime.UtcNow;

        _context.NonConformanceReports.Update(ncr);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Update", "NonConformanceReport", id.ToString(), newValues: $"NCR {ncr.NcrNumber} updated.");

        return await GetNcrByIdAsync(id);
    }

    public async Task<NonConformanceReportDto> AssignNcrAsync(Guid id, AssignNcrDto dto, Guid currentUserId)
    {
        var ncr = await _context.NonConformanceReports.FirstOrDefaultAsync(n => n.Id == id);
        if (ncr == null)
            throw new KeyNotFoundException($"NCR with ID {id} was not found.");

        if (ncr.Status == NcrStatus.Closed || ncr.Status == NcrStatus.Cancelled)
            throw new BadRequestException("Closed or Cancelled NCR cannot be re-assigned.");

        var userExists = await _context.Users.AnyAsync(u => u.Id == dto.AssignedToUserId && u.IsActive);
        if (!userExists)
            throw new BadRequestException($"User {dto.AssignedToUserId} is not an active user.");

        ncr.AssignedToUserId = dto.AssignedToUserId;
        ncr.UpdatedBy = currentUserId;
        ncr.UpdatedAt = DateTime.UtcNow;

        _context.NonConformanceReports.Update(ncr);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Assign", "NonConformanceReport", id.ToString(), newValues: $"Assigned to {dto.AssignedToUserId}");

        return await GetNcrByIdAsync(id);
    }

    public async Task<NonConformanceReportDto> UpdateNcrStatusAsync(Guid id, UpdateNcrStatusDto dto, Guid currentUserId)
    {
        var ncr = await _context.NonConformanceReports.FirstOrDefaultAsync(n => n.Id == id);
        if (ncr == null)
            throw new KeyNotFoundException($"NCR with ID {id} was not found.");

        if (ncr.Status == NcrStatus.Closed && dto.Status != NcrStatus.Closed)
            throw new BadRequestException("Closed NCR cannot be arbitrarily re-opened.");

        ncr.Status = dto.Status;
        if (dto.Status == NcrStatus.Closed)
        {
            ncr.ClosedDate = DateTime.UtcNow;
            ncr.ClosureRemarks = dto.ClosureRemarks;
        }

        ncr.UpdatedBy = currentUserId;
        ncr.UpdatedAt = DateTime.UtcNow;

        _context.NonConformanceReports.Update(ncr);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("StatusChange", "NonConformanceReport", id.ToString(), newValues: $"Status updated to {dto.Status}");

        return await GetNcrByIdAsync(id);
    }

    // ==========================================
    // STAGE B — CAPA
    // ==========================================
    public async Task<PagedResult<CapaDto>> GetCapasAsync(
        int pageNumber = 1,
        int pageSize = 10,
        string? search = null,
        CapaStatus? status = null,
        Guid? ncrId = null)
    {
        var query = _context.CAPAs
            .Include(c => c.NonConformanceReport)
            .Include(c => c.OwnerEmployee)
                .ThenInclude(e => e!.User)
            .AsNoTracking();

        if (ncrId.HasValue)
        {
            query = query.Where(c => c.NcrId == ncrId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(c => c.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c =>
                c.CapaNumber.ToLower().Contains(s) ||
                c.Title.ToLower().Contains(s) ||
                c.Description.ToLower().Contains(s) ||
                c.NonConformanceReport!.NcrNumber.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<CapaDto>
        {
            Items = items.Select(MapToCapaDto).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<CapaDto> GetCapaByIdAsync(Guid id)
    {
        var capa = await _context.CAPAs
            .Include(c => c.NonConformanceReport)
            .Include(c => c.OwnerEmployee)
                .ThenInclude(e => e!.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (capa == null)
            throw new KeyNotFoundException($"CAPA with ID {id} was not found.");

        return MapToCapaDto(capa);
    }

    public async Task<CapaDto> CreateCapaAsync(CreateCapaDto dto, Guid currentUserId)
    {
        var ncr = await _context.NonConformanceReports.FirstOrDefaultAsync(n => n.Id == dto.NcrId);
        if (ncr == null)
            throw new KeyNotFoundException($"NCR with ID {dto.NcrId} was not found.");

        var employee = await _context.EmployeeProfiles.FirstOrDefaultAsync(e => e.Id == dto.OwnerEmployeeId && e.Status == EmploymentStatus.Active);
        if (employee == null)
            throw new BadRequestException($"Owner Employee {dto.OwnerEmployeeId} does not exist or is not active.");

        string capaNumber = $"CAPA-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..4].ToUpper()}";

        var capa = new CAPA
        {
            Id = Guid.NewGuid(),
            CapaNumber = capaNumber,
            NcrId = dto.NcrId,
            Type = dto.Type,
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim(),
            RootCause = dto.RootCause?.Trim(),
            ContainmentAction = dto.ContainmentAction?.Trim(),
            CorrectiveAction = dto.CorrectiveAction?.Trim(),
            PreventiveAction = dto.PreventiveAction?.Trim(),
            OwnerEmployeeId = dto.OwnerEmployeeId,
            TargetDate = dto.TargetDate,
            Status = CapaStatus.Open,
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _context.CAPAs.AddAsync(capa);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Create", "CAPA", capa.Id.ToString(), newValues: $"CAPA {capaNumber} created for NCR {ncr.NcrNumber}");

        return await GetCapaByIdAsync(capa.Id);
    }

    public async Task<CapaDto> UpdateCapaAsync(Guid id, UpdateCapaDto dto, Guid currentUserId)
    {
        var capa = await _context.CAPAs.FirstOrDefaultAsync(c => c.Id == id);
        if (capa == null)
            throw new KeyNotFoundException($"CAPA with ID {id} was not found.");

        if (capa.Status == CapaStatus.Closed || capa.Status == CapaStatus.Cancelled)
            throw new BadRequestException("Closed or Cancelled CAPA cannot be silently edited.");

        var employee = await _context.EmployeeProfiles.FirstOrDefaultAsync(e => e.Id == dto.OwnerEmployeeId && e.Status == EmploymentStatus.Active);
        if (employee == null)
            throw new BadRequestException($"Owner Employee {dto.OwnerEmployeeId} does not exist or is not active.");

        capa.Type = dto.Type;
        capa.Title = dto.Title.Trim();
        capa.Description = dto.Description.Trim();
        capa.RootCause = dto.RootCause?.Trim();
        capa.ContainmentAction = dto.ContainmentAction?.Trim();
        capa.CorrectiveAction = dto.CorrectiveAction?.Trim();
        capa.PreventiveAction = dto.PreventiveAction?.Trim();
        capa.OwnerEmployeeId = dto.OwnerEmployeeId;
        capa.TargetDate = dto.TargetDate;
        capa.Status = dto.Status;
        capa.UpdatedBy = currentUserId;
        capa.UpdatedAt = DateTime.UtcNow;

        _context.CAPAs.Update(capa);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Update", "CAPA", id.ToString(), newValues: $"CAPA {capa.CapaNumber} updated");

        return await GetCapaByIdAsync(id);
    }

    public async Task<CapaDto> VerifyCapaAsync(Guid id, VerifyCapaDto dto, Guid currentUserId)
    {
        var capa = await _context.CAPAs.FirstOrDefaultAsync(c => c.Id == id);
        if (capa == null)
            throw new KeyNotFoundException($"CAPA with ID {id} was not found.");

        if (capa.Status == CapaStatus.Closed || capa.Status == CapaStatus.Cancelled)
            throw new BadRequestException("Closed or Cancelled CAPA cannot be re-verified.");

        capa.Status = dto.IsEffective ? CapaStatus.Effective : CapaStatus.Ineffective;
        capa.VerificationNotes = dto.VerificationNotes.Trim();
        capa.CompletedDate = DateTime.UtcNow;
        capa.UpdatedBy = currentUserId;
        capa.UpdatedAt = DateTime.UtcNow;

        _context.CAPAs.Update(capa);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Verify", "CAPA", id.ToString(), newValues: $"Verified: Effective={dto.IsEffective}");

        return await GetCapaByIdAsync(id);
    }

    public async Task<CapaDto> CloseCapaAsync(Guid id, string notes, Guid currentUserId)
    {
        var capa = await _context.CAPAs.FirstOrDefaultAsync(c => c.Id == id);
        if (capa == null)
            throw new KeyNotFoundException($"CAPA with ID {id} was not found.");

        if (capa.Status != CapaStatus.Effective && capa.Status != CapaStatus.Ineffective && capa.Status != CapaStatus.PendingVerification)
            throw new BadRequestException("CAPA cannot be closed without completing required actions and verification.");

        capa.Status = CapaStatus.Closed;
        if (!string.IsNullOrWhiteSpace(notes))
        {
            capa.VerificationNotes = string.IsNullOrWhiteSpace(capa.VerificationNotes) ? notes.Trim() : $"{capa.VerificationNotes} | Closure: {notes.Trim()}";
        }
        capa.CompletedDate ??= DateTime.UtcNow;
        capa.UpdatedBy = currentUserId;
        capa.UpdatedAt = DateTime.UtcNow;

        _context.CAPAs.Update(capa);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Close", "CAPA", id.ToString(), newValues: $"CAPA {capa.CapaNumber} closed");

        return await GetCapaByIdAsync(id);
    }

    // ==========================================
    // STAGE C — QUALITY DISPOSITION
    // ==========================================
    public async Task<PagedResult<QualityDispositionDto>> GetDispositionsAsync(
        int pageNumber = 1,
        int pageSize = 10,
        string? search = null,
        DispositionStatus? status = null,
        Guid? inspectionId = null)
    {
        var query = _context.QualityDispositions
            .Include(d => d.QualityInspection)
            .Include(d => d.NonConformanceReport)
            .Include(d => d.Product)
            .Include(d => d.Warehouse)
            .Include(d => d.WarehouseLocation)
            .Include(d => d.Batch)
            .Include(d => d.SerialNumber)
            .Include(d => d.ApprovedByUser)
            .AsNoTracking();

        if (inspectionId.HasValue)
        {
            query = query.Where(d => d.QualityInspectionId == inspectionId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(d => d.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(d =>
                d.DispositionNumber.ToLower().Contains(s) ||
                d.Reason.ToLower().Contains(s) ||
                d.Product!.ProductCode.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<QualityDispositionDto>
        {
            Items = items.Select(MapToDispositionDto).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<QualityDispositionDto> GetDispositionByIdAsync(Guid id)
    {
        var disp = await _context.QualityDispositions
            .Include(d => d.QualityInspection)
            .Include(d => d.NonConformanceReport)
            .Include(d => d.Product)
            .Include(d => d.Warehouse)
            .Include(d => d.WarehouseLocation)
            .Include(d => d.Batch)
            .Include(d => d.SerialNumber)
            .Include(d => d.ApprovedByUser)
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id);

        if (disp == null)
            throw new KeyNotFoundException($"Disposition with ID {id} was not found.");

        return MapToDispositionDto(disp);
    }

    public async Task<QualityDispositionDto> CreateDispositionAsync(CreateQualityDispositionDto dto, Guid currentUserId)
    {
        if (dto.Quantity <= 0)
            throw new BadRequestException("Disposition quantity must be greater than zero.");

        var inspection = await _context.QualityInspections.FirstOrDefaultAsync(q => q.Id == dto.QualityInspectionId);
        if (inspection == null)
            throw new KeyNotFoundException($"Quality Inspection {dto.QualityInspectionId} was not found.");

        // Check disposition quantity limit against inspection failed quantity
        var existingDisposedQty = await _context.QualityDispositions
            .Where(d => d.QualityInspectionId == dto.QualityInspectionId && d.Status != DispositionStatus.Rejected)
            .SumAsync(d => d.Quantity);

        decimal availableFailedQty = inspection.FailedQuantity - existingDisposedQty;
        if (dto.Quantity > availableFailedQty)
        {
            throw new BadRequestException($"Requested disposition quantity ({dto.Quantity}) exceeds available failed quantity ({availableFailedQty}) for inspection {inspection.InspectionNumber}.");
        }

        var productExists = await _context.Products.AnyAsync(p => p.Id == dto.ProductId);
        if (!productExists)
            throw new KeyNotFoundException($"Product {dto.ProductId} was not found.");

        var warehouseExists = await _context.Warehouses.AnyAsync(w => w.Id == dto.WarehouseId);
        if (!warehouseExists)
            throw new KeyNotFoundException($"Warehouse {dto.WarehouseId} was not found.");

        string dispNumber = $"DISP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..4].ToUpper()}";

        var disposition = new QualityDisposition
        {
            Id = Guid.NewGuid(),
            DispositionNumber = dispNumber,
            QualityInspectionId = dto.QualityInspectionId,
            NcrId = dto.NcrId,
            ProductId = dto.ProductId,
            Quantity = dto.Quantity,
            WarehouseId = dto.WarehouseId,
            WarehouseLocationId = dto.WarehouseLocationId,
            BatchId = dto.BatchId,
            SerialNumberId = dto.SerialNumberId,
            DispositionType = dto.DispositionType,
            Reason = dto.Reason.Trim(),
            Status = DispositionStatus.Pending,
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _context.QualityDispositions.AddAsync(disposition);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Create", "QualityDisposition", disposition.Id.ToString(), newValues: $"Disposition {dispNumber} created for Type {dto.DispositionType}");

        return await GetDispositionByIdAsync(disposition.Id);
    }

    public async Task<QualityDispositionDto> ApproveDispositionAsync(Guid id, ApproveDispositionDto dto, Guid currentUserId)
    {
        var disp = await _context.QualityDispositions.FirstOrDefaultAsync(d => d.Id == id);
        if (disp == null)
            throw new KeyNotFoundException($"Disposition with ID {id} was not found.");

        if (disp.Status != DispositionStatus.Pending)
            throw new BadRequestException("Only Pending dispositions can be approved or rejected.");

        disp.Status = dto.Approve ? DispositionStatus.Approved : DispositionStatus.Rejected;
        disp.ApprovedByUserId = currentUserId;
        disp.ApprovedDate = DateTime.UtcNow;
        disp.UpdatedBy = currentUserId;
        disp.UpdatedAt = DateTime.UtcNow;

        _context.QualityDispositions.Update(disp);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Approve", "QualityDisposition", id.ToString(), newValues: $"Status: {disp.Status}");

        return await GetDispositionByIdAsync(id);
    }

    // ==========================================
    // STAGE D — REWORK
    // ==========================================
    public async Task<PagedResult<ReworkRequestDto>> GetReworkRequestsAsync(
        int pageNumber = 1,
        int pageSize = 10,
        string? search = null,
        ReworkStatus? status = null)
    {
        var query = _context.ReworkRequests
            .Include(r => r.QualityInspection)
            .Include(r => r.NonConformanceReport)
            .Include(r => r.ProductionExecution)
            .Include(r => r.Product)
            .Include(r => r.AssignedWorkCenter)
            .Include(r => r.AssignedEmployee)
                .ThenInclude(e => e!.User)
            .Include(r => r.ApprovedByUser)
            .AsNoTracking();

        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(r =>
                r.ReworkNumber.ToLower().Contains(s) ||
                r.Reason.ToLower().Contains(s) ||
                r.Product!.ProductCode.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<ReworkRequestDto>
        {
            Items = items.Select(MapToReworkDto).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<ReworkRequestDto> GetReworkRequestByIdAsync(Guid id)
    {
        var rework = await _context.ReworkRequests
            .Include(r => r.QualityInspection)
            .Include(r => r.NonConformanceReport)
            .Include(r => r.ProductionExecution)
            .Include(r => r.Product)
            .Include(r => r.AssignedWorkCenter)
            .Include(r => r.AssignedEmployee)
                .ThenInclude(e => e!.User)
            .Include(r => r.ApprovedByUser)
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id);

        if (rework == null)
            throw new KeyNotFoundException($"Rework Request with ID {id} was not found.");

        return MapToReworkDto(rework);
    }

    public async Task<ReworkRequestDto> CreateReworkRequestAsync(CreateReworkRequestDto dto, Guid currentUserId)
    {
        if (dto.Quantity <= 0)
            throw new BadRequestException("Rework quantity must be greater than zero.");

        var inspection = await _context.QualityInspections.FirstOrDefaultAsync(q => q.Id == dto.QualityInspectionId);
        if (inspection == null)
            throw new KeyNotFoundException($"Quality Inspection {dto.QualityInspectionId} was not found.");

        if (dto.Quantity > inspection.FailedQuantity)
            throw new BadRequestException($"Rework quantity ({dto.Quantity}) cannot exceed inspection failed quantity ({inspection.FailedQuantity}).");

        if (dto.AssignedWorkCenterId.HasValue)
        {
            var wcExists = await _context.WorkCenters.AnyAsync(w => w.Id == dto.AssignedWorkCenterId.Value && w.IsActive);
            if (!wcExists)
                throw new BadRequestException($"Work Center {dto.AssignedWorkCenterId.Value} is invalid or inactive.");
        }

        if (dto.AssignedEmployeeId.HasValue)
        {
            var empExists = await _context.EmployeeProfiles.AnyAsync(e => e.Id == dto.AssignedEmployeeId.Value && e.Status == EmploymentStatus.Active);
            if (!empExists)
                throw new BadRequestException($"Employee {dto.AssignedEmployeeId.Value} is invalid or not active.");
        }

        string reworkNumber = $"RWK-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..4].ToUpper()}";

        var rework = new ReworkRequest
        {
            Id = Guid.NewGuid(),
            ReworkNumber = reworkNumber,
            QualityInspectionId = dto.QualityInspectionId,
            NcrId = dto.NcrId,
            ProductionExecutionId = dto.ProductionExecutionId,
            ProductId = dto.ProductId,
            Quantity = dto.Quantity,
            Reason = dto.Reason.Trim(),
            AssignedWorkCenterId = dto.AssignedWorkCenterId,
            AssignedEmployeeId = dto.AssignedEmployeeId,
            Status = ReworkStatus.Requested,
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _context.ReworkRequests.AddAsync(rework);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Create", "ReworkRequest", rework.Id.ToString(), newValues: $"Rework {reworkNumber} created for Qty {dto.Quantity}");

        return await GetReworkRequestByIdAsync(rework.Id);
    }

    public async Task<ReworkRequestDto> ApproveReworkRequestAsync(Guid id, ApproveReworkDto dto, Guid currentUserId)
    {
        var rework = await _context.ReworkRequests.FirstOrDefaultAsync(r => r.Id == id);
        if (rework == null)
            throw new KeyNotFoundException($"Rework Request with ID {id} was not found.");

        if (rework.Status != ReworkStatus.Requested)
            throw new BadRequestException("Only Requested rework can be approved or rejected.");

        rework.Status = dto.Approve ? ReworkStatus.Approved : ReworkStatus.Rejected;
        rework.ApprovedByUserId = currentUserId;
        rework.Remarks = dto.Remarks?.Trim();
        rework.UpdatedBy = currentUserId;
        rework.UpdatedAt = DateTime.UtcNow;

        _context.ReworkRequests.Update(rework);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Approve", "ReworkRequest", id.ToString(), newValues: $"Status: {rework.Status}");

        return await GetReworkRequestByIdAsync(id);
    }

    public async Task<ReworkRequestDto> StartReworkAsync(Guid id, Guid currentUserId)
    {
        var rework = await _context.ReworkRequests.FirstOrDefaultAsync(r => r.Id == id);
        if (rework == null)
            throw new KeyNotFoundException($"Rework Request with ID {id} was not found.");

        if (rework.Status != ReworkStatus.Approved)
            throw new BadRequestException("Only Approved rework requests can be started.");

        rework.Status = ReworkStatus.InProgress;
        rework.StartDate = DateTime.UtcNow;
        rework.UpdatedBy = currentUserId;
        rework.UpdatedAt = DateTime.UtcNow;

        _context.ReworkRequests.Update(rework);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Start", "ReworkRequest", id.ToString(), newValues: "Rework started");

        return await GetReworkRequestByIdAsync(id);
    }

    public async Task<ReworkRequestDto> CompleteReworkRequestAsync(Guid id, CompleteReworkDto dto, Guid currentUserId)
    {
        var rework = await _context.ReworkRequests.FirstOrDefaultAsync(r => r.Id == id);
        if (rework == null)
            throw new KeyNotFoundException($"Rework Request with ID {id} was not found.");

        if (rework.Status != ReworkStatus.InProgress)
            throw new BadRequestException("Only InProgress rework requests can be completed.");

        rework.Status = ReworkStatus.Completed;
        rework.CompletionDate = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(dto.Remarks)) rework.Remarks = dto.Remarks.Trim();
        rework.UpdatedBy = currentUserId;
        rework.UpdatedAt = DateTime.UtcNow;

        _context.ReworkRequests.Update(rework);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Complete", "ReworkRequest", id.ToString(), newValues: $"Rework {rework.ReworkNumber} completed");

        return await GetReworkRequestByIdAsync(id);
    }

    // ==========================================
    // STAGE E — SCRAP
    // ==========================================
    public async Task<PagedResult<ScrapRecordDto>> GetScrapRecordsAsync(
        int pageNumber = 1,
        int pageSize = 10,
        string? search = null,
        ScrapStatus? status = null)
    {
        var query = _context.ScrapRecords
            .Include(s => s.QualityInspection)
            .Include(s => s.NonConformanceReport)
            .Include(s => s.Product)
            .Include(s => s.Warehouse)
            .Include(s => s.WarehouseLocation)
            .Include(s => s.Batch)
            .Include(s => s.SerialNumber)
            .Include(s => s.ApprovedByUser)
            .AsNoTracking();

        if (status.HasValue)
        {
            query = query.Where(s => s.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(sr =>
                sr.ScrapNumber.ToLower().Contains(s) ||
                sr.Reason.ToLower().Contains(s) ||
                sr.Product!.ProductCode.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<ScrapRecordDto>
        {
            Items = items.Select(MapToScrapDto).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<ScrapRecordDto> GetScrapRecordByIdAsync(Guid id)
    {
        var scrap = await _context.ScrapRecords
            .Include(s => s.QualityInspection)
            .Include(s => s.NonConformanceReport)
            .Include(s => s.Product)
            .Include(s => s.Warehouse)
            .Include(s => s.WarehouseLocation)
            .Include(s => s.Batch)
            .Include(s => s.SerialNumber)
            .Include(s => s.ApprovedByUser)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);

        if (scrap == null)
            throw new KeyNotFoundException($"Scrap Record with ID {id} was not found.");

        return MapToScrapDto(scrap);
    }

    public async Task<ScrapRecordDto> CreateScrapRecordAsync(CreateScrapRecordDto dto, Guid currentUserId)
    {
        if (dto.Quantity <= 0)
            throw new BadRequestException("Scrap quantity must be greater than zero.");

        var inspection = await _context.QualityInspections.FirstOrDefaultAsync(q => q.Id == dto.QualityInspectionId);
        if (inspection == null)
            throw new KeyNotFoundException($"Quality Inspection {dto.QualityInspectionId} was not found.");

        if (dto.Quantity > inspection.FailedQuantity)
            throw new BadRequestException($"Scrap quantity ({dto.Quantity}) cannot exceed inspection failed quantity ({inspection.FailedQuantity}).");

        var productExists = await _context.Products.AnyAsync(p => p.Id == dto.ProductId);
        if (!productExists)
            throw new KeyNotFoundException($"Product {dto.ProductId} was not found.");

        var warehouseExists = await _context.Warehouses.AnyAsync(w => w.Id == dto.WarehouseId);
        if (!warehouseExists)
            throw new KeyNotFoundException($"Warehouse {dto.WarehouseId} was not found.");

        string scrapNumber = $"SCRAP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..4].ToUpper()}";

        var scrap = new ScrapRecord
        {
            Id = Guid.NewGuid(),
            ScrapNumber = scrapNumber,
            QualityInspectionId = dto.QualityInspectionId,
            NcrId = dto.NcrId,
            ProductId = dto.ProductId,
            BatchId = dto.BatchId,
            SerialNumberId = dto.SerialNumberId,
            WarehouseId = dto.WarehouseId,
            WarehouseLocationId = dto.WarehouseLocationId,
            Quantity = dto.Quantity,
            Reason = dto.Reason.Trim(),
            Status = ScrapStatus.Pending,
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _context.ScrapRecords.AddAsync(scrap);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Create", "ScrapRecord", scrap.Id.ToString(), newValues: $"Scrap Record {scrapNumber} created for Qty {dto.Quantity}");

        return await GetScrapRecordByIdAsync(scrap.Id);
    }

    public async Task<ScrapRecordDto> ApproveScrapRecordAsync(Guid id, ApproveScrapDto dto, Guid currentUserId)
    {
        var scrap = await _context.ScrapRecords.FirstOrDefaultAsync(s => s.Id == id);
        if (scrap == null)
            throw new KeyNotFoundException($"Scrap Record with ID {id} was not found.");

        if (scrap.Status != ScrapStatus.Pending)
            throw new BadRequestException("Only Pending scrap records can be approved or rejected.");

        if (!dto.Approve)
        {
            scrap.Status = ScrapStatus.Rejected;
            scrap.ApprovedByUserId = currentUserId;
            scrap.ScrapDate = DateTime.UtcNow;
            scrap.Remarks = dto.Remarks?.Trim();
            scrap.UpdatedBy = currentUserId;
            scrap.UpdatedAt = DateTime.UtcNow;

            _context.ScrapRecords.Update(scrap);
            await _context.SaveChangesAsync();

            await _auditLogger.LogAsync("Approve", "ScrapRecord", id.ToString(), newValues: "Scrap Record Rejected");
            return await GetScrapRecordByIdAsync(id);
        }

        // PHYSICAL INVENTORY DISPOSAL VIA AUTHORITATIVE INVENTORY MOVEMENT SERVICE
        await _inventoryMovementService.AdjustAsync(
            scrap.ProductId,
            scrap.WarehouseId,
            scrap.WarehouseLocationId,
            -scrap.Quantity,
            $"Scrap Disposal: {scrap.ScrapNumber} - {scrap.Reason}",
            currentUserId
        );

        scrap.Status = ScrapStatus.Approved;
        scrap.ApprovedByUserId = currentUserId;
        scrap.ScrapDate = DateTime.UtcNow;
        scrap.Remarks = dto.Remarks?.Trim();
        scrap.UpdatedBy = currentUserId;
        scrap.UpdatedAt = DateTime.UtcNow;

        _context.ScrapRecords.Update(scrap);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Approve", "ScrapRecord", id.ToString(), newValues: $"Scrap Record {scrap.ScrapNumber} approved & stock disposed (-{scrap.Quantity})");

        return await GetScrapRecordByIdAsync(id);
    }

    // ==========================================
    // STAGE G — QUALITY COMPLIANCE SUMMARY REPORT
    // ==========================================
    public async Task<QualityComplianceSummaryDto> GetComplianceSummaryReportAsync()
    {
        var ncrs = await _context.NonConformanceReports.AsNoTracking().ToListAsync();
        var capas = await _context.CAPAs.AsNoTracking().ToListAsync();
        var dispositions = await _context.QualityDispositions.AsNoTracking().ToListAsync();
        var reworks = await _context.ReworkRequests.AsNoTracking().ToListAsync();
        var scraps = await _context.ScrapRecords.AsNoTracking().ToListAsync();
        var defects = await _context.QualityDefects.AsNoTracking().ToListAsync();

        var now = DateTime.UtcNow;

        return new QualityComplianceSummaryDto
        {
            TotalNcrs = ncrs.Count,
            OpenNcrs = ncrs.Count(n => n.Status == NcrStatus.Open || n.Status == NcrStatus.UnderInvestigation || n.Status == NcrStatus.DispositionPending || n.Status == NcrStatus.ActionPending),
            ClosedNcrs = ncrs.Count(n => n.Status == NcrStatus.Closed),
            NcrsBySeverity = ncrs.GroupBy(n => n.Severity.ToString()).ToDictionary(g => g.Key, g => g.Count()),

            TotalCapas = capas.Count,
            OpenCapas = capas.Count(c => c.Status == CapaStatus.Open || c.Status == CapaStatus.InProgress || c.Status == CapaStatus.PendingVerification),
            ClosedCapas = capas.Count(c => c.Status == CapaStatus.Closed),
            OverdueCapas = capas.Count(c => c.TargetDate.HasValue && c.TargetDate.Value < now && c.Status != CapaStatus.Closed && c.Status != CapaStatus.Cancelled),

            TotalDispositions = dispositions.Count,
            DispositionsByType = dispositions.GroupBy(d => d.DispositionType.ToString()).ToDictionary(g => g.Key, g => g.Count()),

            TotalReworkRequests = reworks.Count,
            CompletedReworkQuantity = reworks.Where(r => r.Status == ReworkStatus.Completed).Sum(r => r.Quantity),

            TotalScrapRecords = scraps.Count,
            TotalScrapQuantity = scraps.Where(s => s.Status == ScrapStatus.Approved).Sum(s => s.Quantity),

            DefectCategorySummary = defects.GroupBy(d => string.IsNullOrEmpty(d.DefectName) ? "General" : d.DefectName).ToDictionary(g => g.Key, g => g.Count())
        };
    }

    // Mapping Helpers
    private static NonConformanceReportDto MapToNcrDto(NonConformanceReport n) => new()
    {
        Id = n.Id,
        NcrNumber = n.NcrNumber,
        QualityInspectionId = n.QualityInspectionId,
        QualityInspectionNumber = n.QualityInspection?.InspectionNumber ?? string.Empty,
        ProductionExecutionId = n.ProductionExecutionId,
        ProductionExecutionNumber = n.ProductionExecution?.ExecutionNumber,
        ProductId = n.ProductId,
        ProductCode = n.Product?.ProductCode ?? string.Empty,
        ProductName = n.Product?.Name ?? string.Empty,
        BatchId = n.BatchId,
        BatchNumber = n.Batch?.BatchNumber,
        SerialNumberId = n.SerialNumberId,
        SerialNumber = n.SerialNumber?.SerialNumber,
        ReportedByUserId = n.ReportedByUserId,
        ReportedByUserName = n.ReportedByUser != null ? $"{n.ReportedByUser.FirstName} {n.ReportedByUser.LastName}".Trim() : string.Empty,
        AssignedToUserId = n.AssignedToUserId,
        AssignedToUserName = n.AssignedToUser != null ? $"{n.AssignedToUser.FirstName} {n.AssignedToUser.LastName}".Trim() : null,
        Severity = n.Severity.ToString(),
        Category = n.Category,
        Description = n.Description,
        DetectedDate = n.DetectedDate,
        Status = n.Status.ToString(),
        ContainmentAction = n.ContainmentAction,
        RootCauseCategory = n.RootCauseCategory,
        RootCauseDescription = n.RootCauseDescription,
        CorrectiveAction = n.CorrectiveAction,
        PreventiveAction = n.PreventiveAction,
        ClosedDate = n.ClosedDate,
        ClosureRemarks = n.ClosureRemarks,
        CreatedAt = n.CreatedAt
    };

    private static CapaDto MapToCapaDto(CAPA c) => new()
    {
        Id = c.Id,
        CapaNumber = c.CapaNumber,
        NcrId = c.NcrId,
        NcrNumber = c.NonConformanceReport?.NcrNumber ?? string.Empty,
        Type = c.Type.ToString(),
        Title = c.Title,
        Description = c.Description,
        RootCause = c.RootCause,
        ContainmentAction = c.ContainmentAction,
        CorrectiveAction = c.CorrectiveAction,
        PreventiveAction = c.PreventiveAction,
        OwnerEmployeeId = c.OwnerEmployeeId,
        OwnerEmployeeName = c.OwnerEmployee != null ? (c.OwnerEmployee.User != null ? $"{c.OwnerEmployee.User.FirstName} {c.OwnerEmployee.User.LastName}".Trim() : c.OwnerEmployee.EmployeeCode) : string.Empty,
        TargetDate = c.TargetDate,
        CompletedDate = c.CompletedDate,
        VerificationNotes = c.VerificationNotes,
        Status = c.Status.ToString(),
        CreatedAt = c.CreatedAt
    };

    private static QualityDispositionDto MapToDispositionDto(QualityDisposition d) => new()
    {
        Id = d.Id,
        DispositionNumber = d.DispositionNumber,
        QualityInspectionId = d.QualityInspectionId,
        QualityInspectionNumber = d.QualityInspection?.InspectionNumber ?? string.Empty,
        NcrId = d.NcrId,
        NcrNumber = d.NonConformanceReport?.NcrNumber,
        ProductId = d.ProductId,
        ProductCode = d.Product?.ProductCode ?? string.Empty,
        ProductName = d.Product?.Name ?? string.Empty,
        Quantity = d.Quantity,
        WarehouseId = d.WarehouseId,
        WarehouseName = d.Warehouse?.WarehouseName ?? string.Empty,
        WarehouseLocationId = d.WarehouseLocationId,
        LocationName = d.WarehouseLocation?.LocationName,
        BatchId = d.BatchId,
        BatchNumber = d.Batch?.BatchNumber,
        SerialNumberId = d.SerialNumberId,
        SerialNumber = d.SerialNumber?.SerialNumber,
        DispositionType = d.DispositionType.ToString(),
        Reason = d.Reason,
        ApprovedByUserId = d.ApprovedByUserId,
        ApprovedByUserName = d.ApprovedByUser != null ? $"{d.ApprovedByUser.FirstName} {d.ApprovedByUser.LastName}".Trim() : null,
        ApprovedDate = d.ApprovedDate,
        Status = d.Status.ToString(),
        CreatedAt = d.CreatedAt
    };

    private static ReworkRequestDto MapToReworkDto(ReworkRequest r) => new()
    {
        Id = r.Id,
        ReworkNumber = r.ReworkNumber,
        QualityInspectionId = r.QualityInspectionId,
        QualityInspectionNumber = r.QualityInspection?.InspectionNumber ?? string.Empty,
        NcrId = r.NcrId,
        NcrNumber = r.NonConformanceReport?.NcrNumber,
        ProductionExecutionId = r.ProductionExecutionId,
        ProductionExecutionNumber = r.ProductionExecution?.ExecutionNumber,
        ProductId = r.ProductId,
        ProductCode = r.Product?.ProductCode ?? string.Empty,
        ProductName = r.Product?.Name ?? string.Empty,
        Quantity = r.Quantity,
        Reason = r.Reason,
        AssignedWorkCenterId = r.AssignedWorkCenterId,
        WorkCenterName = r.AssignedWorkCenter?.Name,
        AssignedEmployeeId = r.AssignedEmployeeId,
        AssignedEmployeeName = r.AssignedEmployee != null ? (r.AssignedEmployee.User != null ? $"{r.AssignedEmployee.User.FirstName} {r.AssignedEmployee.User.LastName}".Trim() : r.AssignedEmployee.EmployeeCode) : null,
        Status = r.Status.ToString(),
        StartDate = r.StartDate,
        CompletionDate = r.CompletionDate,
        Remarks = r.Remarks,
        ApprovedByUserId = r.ApprovedByUserId,
        ApprovedByUserName = r.ApprovedByUser != null ? $"{r.ApprovedByUser.FirstName} {r.ApprovedByUser.LastName}".Trim() : null,
        CreatedAt = r.CreatedAt
    };

    private static ScrapRecordDto MapToScrapDto(ScrapRecord s) => new()
    {
        Id = s.Id,
        ScrapNumber = s.ScrapNumber,
        QualityInspectionId = s.QualityInspectionId,
        QualityInspectionNumber = s.QualityInspection?.InspectionNumber ?? string.Empty,
        NcrId = s.NcrId,
        NcrNumber = s.NonConformanceReport?.NcrNumber,
        ProductId = s.ProductId,
        ProductCode = s.Product?.ProductCode ?? string.Empty,
        ProductName = s.Product?.Name ?? string.Empty,
        BatchId = s.BatchId,
        BatchNumber = s.Batch?.BatchNumber,
        SerialNumberId = s.SerialNumberId,
        SerialNumber = s.SerialNumber?.SerialNumber,
        WarehouseId = s.WarehouseId,
        WarehouseName = s.Warehouse?.WarehouseName ?? string.Empty,
        WarehouseLocationId = s.WarehouseLocationId,
        LocationName = s.WarehouseLocation?.LocationName,
        Quantity = s.Quantity,
        Reason = s.Reason,
        ApprovedByUserId = s.ApprovedByUserId,
        ApprovedByUserName = s.ApprovedByUser != null ? $"{s.ApprovedByUser.FirstName} {s.ApprovedByUser.LastName}".Trim() : null,
        ScrapDate = s.ScrapDate,
        Status = s.Status.ToString(),
        Remarks = s.Remarks,
        CreatedAt = s.CreatedAt
    };
}
