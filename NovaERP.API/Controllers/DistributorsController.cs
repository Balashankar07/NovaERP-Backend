using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Models;
using NovaERP.Application.DTOs.Sales;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DistributorsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly AppDbContext _context;

    public DistributorsController(IUnitOfWork unitOfWork, AppDbContext context)
    {
        _unitOfWork = unitOfWork;
        _context = context;
    }

    [HttpGet]
    [HasPermission("Permissions.SalesOrders.View")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortOrder = null)
    {
        var pagedResult = await _unitOfWork.Distributors.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        var dtos = pagedResult.Items.Select(d => new DistributorDto
        {
            Id = d.Id,
            CompanyName = d.CompanyName,
            ContactPerson = d.ContactPerson,
            Email = d.Email,
            Phone = d.Phone,
            Address = d.Address,
            IsActive = d.IsActive
        }).ToList();

        var result = new PagedResult<DistributorDto>
        {
            Items = dtos,
            TotalCount = pagedResult.TotalCount,
            PageNumber = pagedResult.PageNumber,
            PageSize = pagedResult.PageSize
        };

        return Ok(ApiResponse.SuccessResponse("Distributors retrieved successfully.", result));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Permissions.SalesOrders.View")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var d = await _unitOfWork.Distributors.GetByIdAsync(id);
        if (d == null)
            return NotFound(ApiResponse.ErrorResponse<DistributorDto>("Distributor not found.", null!));

        var dto = new DistributorDto
        {
            Id = d.Id,
            CompanyName = d.CompanyName,
            ContactPerson = d.ContactPerson,
            Email = d.Email,
            Phone = d.Phone,
            Address = d.Address,
            IsActive = d.IsActive
        };

        return Ok(ApiResponse.SuccessResponse("Distributor retrieved successfully.", dto));
    }

    [HttpPost]
    [HasPermission("Permissions.SalesOrders.Create")]
    public async Task<IActionResult> Create([FromBody] CreateDistributorDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CompanyName))
            return BadRequest(ApiResponse.ErrorResponse<DistributorDto>("Company Name is required.", null!));

        var distributor = new Distributor
        {
            CompanyName = dto.CompanyName.Trim(),
            ContactPerson = dto.ContactPerson?.Trim() ?? string.Empty,
            Email = dto.Email?.Trim() ?? string.Empty,
            Phone = dto.Phone?.Trim() ?? string.Empty,
            Address = dto.Address?.Trim() ?? string.Empty,
            IsActive = true
        };

        await _unitOfWork.Distributors.AddAsync(distributor);
        await _unitOfWork.SaveChangesAsync();

        var resultDto = new DistributorDto
        {
            Id = distributor.Id,
            CompanyName = distributor.CompanyName,
            ContactPerson = distributor.ContactPerson,
            Email = distributor.Email,
            Phone = distributor.Phone,
            Address = distributor.Address,
            IsActive = distributor.IsActive
        };

        return CreatedAtAction(nameof(GetById), new { id = distributor.Id }, ApiResponse.SuccessResponse("Distributor created successfully.", resultDto));
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Permissions.SalesOrders.Update")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDistributorDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CompanyName))
            return BadRequest(ApiResponse.ErrorResponse<DistributorDto>("Company Name is required.", null!));

        var distributor = await _unitOfWork.Distributors.GetByIdAsync(id);
        if (distributor == null)
            return NotFound(ApiResponse.ErrorResponse<DistributorDto>("Distributor not found.", null!));

        distributor.CompanyName = dto.CompanyName.Trim();
        distributor.ContactPerson = dto.ContactPerson?.Trim() ?? string.Empty;
        distributor.Email = dto.Email?.Trim() ?? string.Empty;
        distributor.Phone = dto.Phone?.Trim() ?? string.Empty;
        distributor.Address = dto.Address?.Trim() ?? string.Empty;
        distributor.IsActive = dto.IsActive;

        _unitOfWork.Distributors.Update(distributor);
        await _unitOfWork.SaveChangesAsync();

        var resultDto = new DistributorDto
        {
            Id = distributor.Id,
            CompanyName = distributor.CompanyName,
            ContactPerson = distributor.ContactPerson,
            Email = distributor.Email,
            Phone = distributor.Phone,
            Address = distributor.Address,
            IsActive = distributor.IsActive
        };

        return Ok(ApiResponse.SuccessResponse("Distributor updated successfully.", resultDto));
    }

    [HttpPatch("{id:guid}/toggle-status")]
    [HasPermission("Permissions.SalesOrders.Update")]
    public async Task<IActionResult> ToggleStatus(Guid id)
    {
        var distributor = await _unitOfWork.Distributors.GetByIdAsync(id);
        if (distributor == null)
            return NotFound(ApiResponse.ErrorResponse("Distributor not found."));

        distributor.IsActive = !distributor.IsActive;
        _unitOfWork.Distributors.Update(distributor);
        await _unitOfWork.SaveChangesAsync();

        return Ok(ApiResponse.SuccessResponse($"Distributor {(distributor.IsActive ? "activated" : "deactivated")} successfully."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Permissions.SalesOrders.Delete")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var distributor = await _unitOfWork.Distributors.GetByIdAsync(id);
        if (distributor == null)
            return NotFound(ApiResponse.ErrorResponse("Distributor not found."));

        var isReferenced = await _context.SalesOrders.AnyAsync(so => so.DistributorId == id);
        if (isReferenced)
        {
            return Conflict(ApiResponse.ErrorResponse("Distributor cannot be deleted because it is referenced by existing sales orders. Deactivate the distributor instead."));
        }

        _unitOfWork.Distributors.Delete(distributor);
        await _unitOfWork.SaveChangesAsync();

        return NoContent();
    }
}
