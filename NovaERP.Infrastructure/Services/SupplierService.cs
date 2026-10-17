using NovaERP.Application.Features.Suppliers.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Services;

public class SupplierService : ISupplierService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;

    public SupplierService(IUnitOfWork unitOfWork, IAuditLogger auditLogger)
    {
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
    }

    public async Task<NovaERP.Application.Common.Models.PagedResult<SupplierDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null, bool? isActive = null)
    {
        var suppliers = await _unitOfWork.Suppliers.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder, isActive);

        return new NovaERP.Application.Common.Models.PagedResult<SupplierDto>
        {
            Items = suppliers.Items.Select(MapToDto).ToList(),
            TotalCount = suppliers.TotalCount,
            PageNumber = suppliers.PageNumber,
            PageSize = suppliers.PageSize
        };
    }

    public async Task<SupplierDto?> GetByIdAsync(Guid id)
    {
        var supplier = await _unitOfWork.Suppliers.GetByIdAsync(id);
        if (supplier == null) return null;
        return MapToDto(supplier);
    }

    public async Task<SupplierDto> CreateAsync(CreateSupplierDto dto)
    {
        var existingCode = await _unitOfWork.Suppliers.GetByCodeAsync(dto.SupplierCode);
        if (existingCode != null)
            throw new Exception("Supplier code already exists.");

        var supplier = new Supplier
        {
            Id = Guid.NewGuid(),
            SupplierCode = dto.SupplierCode,
            SupplierName = dto.SupplierName,
            CompanyName = dto.CompanyName,
            ContactPerson = dto.ContactPerson,
            Email = dto.Email,
            Phone = dto.Phone,
            Mobile = dto.Mobile,
            Website = dto.Website,
            AddressLine1 = dto.AddressLine1,
            AddressLine2 = dto.AddressLine2,
            City = dto.City,
            State = dto.State,
            Country = dto.Country,
            PostalCode = dto.PostalCode,
            TaxRegistrationNumber = dto.TaxRegistrationNumber,
            PaymentTerms = dto.PaymentTerms,
            Currency = dto.Currency,
            CreditLimit = dto.CreditLimit,
            Notes = dto.Notes,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Suppliers.AddAsync(supplier);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Create", "Supplier", supplier.Id.ToString(), newValues: $"Code: {supplier.SupplierCode}, Name: {supplier.SupplierName}");

        return MapToDto(supplier);
    }

    public async Task<SupplierDto?> UpdateAsync(Guid id, UpdateSupplierDto dto)
    {
        var supplier = await _unitOfWork.Suppliers.GetByIdAsync(id);
        if (supplier == null) return null;

        if (supplier.SupplierCode != dto.SupplierCode)
        {
            var existingCode = await _unitOfWork.Suppliers.GetByCodeAsync(dto.SupplierCode);
            if (existingCode != null)
                throw new Exception("Supplier code already exists.");
        }

        supplier.SupplierCode = dto.SupplierCode;
        supplier.SupplierName = dto.SupplierName;
        supplier.CompanyName = dto.CompanyName;
        supplier.ContactPerson = dto.ContactPerson;
        supplier.Email = dto.Email;
        supplier.Phone = dto.Phone;
        supplier.Mobile = dto.Mobile;
        supplier.Website = dto.Website;
        supplier.AddressLine1 = dto.AddressLine1;
        supplier.AddressLine2 = dto.AddressLine2;
        supplier.City = dto.City;
        supplier.State = dto.State;
        supplier.Country = dto.Country;
        supplier.PostalCode = dto.PostalCode;
        supplier.TaxRegistrationNumber = dto.TaxRegistrationNumber;
        supplier.PaymentTerms = dto.PaymentTerms;
        supplier.Currency = dto.Currency;
        supplier.CreditLimit = dto.CreditLimit;
        supplier.Notes = dto.Notes;
        supplier.IsActive = dto.IsActive;
        supplier.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Suppliers.Update(supplier);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Update", "Supplier", supplier.Id.ToString());

        return MapToDto(supplier);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var supplier = await _unitOfWork.Suppliers.GetByIdAsync(id);
        if (supplier == null) return false;

        var isReferenced = await _unitOfWork.Suppliers.IsSupplierReferencedAsync(id);
        if (isReferenced)
        {
            throw new InvalidOperationException("Supplier cannot be deleted because it is referenced by existing procurement records. Deactivate the supplier instead.");
        }

        _unitOfWork.Suppliers.Delete(supplier);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Delete", "Supplier", supplier.Id.ToString());

        return true;
    }

    public async Task ActivateAsync(Guid id)
    {
        var supplier = await _unitOfWork.Suppliers.GetByIdAsync(id);
        if (supplier == null) throw new Exception("Supplier not found.");

        if (supplier.IsActive) return;

        supplier.IsActive = true;
        supplier.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Suppliers.Update(supplier);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Activate", "Supplier", supplier.Id.ToString(), newValues: "IsActive: true");
    }

    public async Task DeactivateAsync(Guid id)
    {
        var supplier = await _unitOfWork.Suppliers.GetByIdAsync(id);
        if (supplier == null) throw new Exception("Supplier not found.");

        if (!supplier.IsActive) return;

        supplier.IsActive = false;
        supplier.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Suppliers.Update(supplier);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Deactivate", "Supplier", supplier.Id.ToString(), newValues: "IsActive: false");
    }

    private static SupplierDto MapToDto(Supplier supplier)
    {
        return new SupplierDto
        {
            Id = supplier.Id,
            SupplierCode = supplier.SupplierCode,
            SupplierName = supplier.SupplierName,
            CompanyName = supplier.CompanyName,
            ContactPerson = supplier.ContactPerson,
            Email = supplier.Email,
            Phone = supplier.Phone,
            Mobile = supplier.Mobile,
            Website = supplier.Website,
            AddressLine1 = supplier.AddressLine1,
            AddressLine2 = supplier.AddressLine2,
            City = supplier.City,
            State = supplier.State,
            Country = supplier.Country,
            PostalCode = supplier.PostalCode,
            TaxRegistrationNumber = supplier.TaxRegistrationNumber,
            PaymentTerms = supplier.PaymentTerms,
            Currency = supplier.Currency,
            CreditLimit = supplier.CreditLimit,
            Notes = supplier.Notes,
            IsActive = supplier.IsActive,
            CreatedAt = supplier.CreatedAt,
            UpdatedAt = supplier.UpdatedAt
        };
    }
}
