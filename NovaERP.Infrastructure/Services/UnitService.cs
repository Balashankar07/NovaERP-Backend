using NovaERP.Application.Features.Units.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;
using NovaERP.Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace NovaERP.Infrastructure.Services;

public class UnitService : IUnitService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly AppDbContext _context;
    private readonly IAuditLogger _auditLogger;

    public UnitService(IUnitOfWork unitOfWork, AppDbContext context, IAuditLogger auditLogger)
    {
        _unitOfWork = unitOfWork;
        _context = context;
        _auditLogger = auditLogger;
    }

    public async Task<NovaERP.Application.Common.Models.PagedResult<UnitDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var units = await _unitOfWork.Units.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);

        return new NovaERP.Application.Common.Models.PagedResult<UnitDto>
        {
            Items = units.Items.Select(MapToDto).ToList(),
            TotalCount = units.TotalCount,
            PageNumber = units.PageNumber,
            PageSize = units.PageSize
        };
    }

    public async Task<UnitDto?> GetByIdAsync(Guid id)
    {
        var unit = await _unitOfWork.Units.GetByIdAsync(id);
        if (unit == null) return null;
        return MapToDto(unit);
    }

    public async Task<UnitDto> CreateAsync(CreateUnitDto dto)
    {
        var unit = new Unit
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Abbreviation = dto.Abbreviation,
            Description = dto.Description,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Units.AddAsync(unit);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Create", "Unit", unit.Id.ToString(), newValues: $"Name: {unit.Name}");

        return MapToDto(unit);
    }

    public async Task<UnitDto?> UpdateAsync(Guid id, UpdateUnitDto dto)
    {
        var unit = await _unitOfWork.Units.GetByIdAsync(id);
        if (unit == null) return null;

        unit.Name = dto.Name;
        unit.Abbreviation = dto.Abbreviation;
        unit.Description = dto.Description;
        unit.IsActive = dto.IsActive;
        unit.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Units.UpdateAsync(unit);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Update", "Unit", unit.Id.ToString());

        return MapToDto(unit);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var unit = await _unitOfWork.Units.GetByIdAsync(id);
        if (unit == null) return false;

        // Block if referenced by Products
        var hasProducts = await _context.Products.AnyAsync(p => p.UnitId == id);
        if (hasProducts)
            throw new ConflictException("Cannot delete Unit because it is assigned to one or more products. Deactivate the unit instead.");

        await _unitOfWork.Units.DeleteAsync(unit);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Delete", "Unit", unit.Id.ToString());

        return true;
    }

    private static UnitDto MapToDto(Unit unit)
    {
        return new UnitDto
        {
            Id = unit.Id,
            Name = unit.Name,
            Abbreviation = unit.Abbreviation,
            Description = unit.Description,
            IsActive = unit.IsActive
        };
    }
}
