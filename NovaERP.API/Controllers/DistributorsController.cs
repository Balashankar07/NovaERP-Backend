using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Models;
using NovaERP.Application.DTOs.Sales;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DistributorsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public DistributorsController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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
            CompanyName = dto.CompanyName,
            ContactPerson = dto.ContactPerson,
            Email = dto.Email,
            Phone = dto.Phone,
            Address = dto.Address,
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
}
