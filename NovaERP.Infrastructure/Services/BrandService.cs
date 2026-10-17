using NovaERP.Application.Features.Brands.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;
using NovaERP.Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace NovaERP.Infrastructure.Services;

public class BrandService : IBrandService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly AppDbContext _context;
    private readonly IAuditLogger _auditLogger;

    public BrandService(IUnitOfWork unitOfWork, AppDbContext context, IAuditLogger auditLogger)
    {
        _unitOfWork = unitOfWork;
        _context = context;
        _auditLogger = auditLogger;
    }

    public async Task<NovaERP.Application.Common.Models.PagedResult<BrandDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var brands = await _unitOfWork.Brands.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);

        return new NovaERP.Application.Common.Models.PagedResult<BrandDto>
        {
            Items = brands.Items.Select(MapToDto).ToList(),
            TotalCount = brands.TotalCount,
            PageNumber = brands.PageNumber,
            PageSize = brands.PageSize
        };
    }

    public async Task<BrandDto?> GetByIdAsync(Guid id)
    {
        var brand = await _unitOfWork.Brands.GetByIdAsync(id);
        if (brand == null) return null;
        return MapToDto(brand);
    }

    public async Task<BrandDto> CreateAsync(CreateBrandDto dto)
    {
        var brand = new Brand
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Description = dto.Description,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Brands.AddAsync(brand);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Create", "Brand", brand.Id.ToString(), newValues: $"Name: {brand.Name}");

        return MapToDto(brand);
    }

    public async Task<BrandDto?> UpdateAsync(Guid id, UpdateBrandDto dto)
    {
        var brand = await _unitOfWork.Brands.GetByIdAsync(id);
        if (brand == null) return null;

        brand.Name = dto.Name;
        brand.Description = dto.Description;
        brand.IsActive = dto.IsActive;
        brand.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Brands.UpdateAsync(brand);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Update", "Brand", brand.Id.ToString());

        return MapToDto(brand);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var brand = await _unitOfWork.Brands.GetByIdAsync(id);
        if (brand == null) return false;

        // Block if referenced by Products
        var hasProducts = await _context.Products.AnyAsync(p => p.BrandId == id);
        if (hasProducts)
            throw new ConflictException("Cannot delete Brand because it is assigned to one or more products. Deactivate the brand instead.");

        await _unitOfWork.Brands.DeleteAsync(brand);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Delete", "Brand", brand.Id.ToString());

        return true;
    }

    private static BrandDto MapToDto(Brand brand)
    {
        return new BrandDto
        {
            Id = brand.Id,
            Name = brand.Name,
            Description = brand.Description,
            IsActive = brand.IsActive
        };
    }
}
