using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Exceptions;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Products.DTOs;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Enums;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    [HasPermission("Permissions.Products.View")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortOrder = null,
        [FromQuery] ProductType? productType = null)
    {
        var products = await _productService.GetAllAsync(
            pageNumber, pageSize, search, sortBy, sortOrder, productType);
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", products));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Permissions.Products.View")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var product = await _productService.GetByIdAsync(id);
        if (product == null) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", product));
    }

    [HttpPost]
    [HasPermission("Permissions.Products.Create")]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        try
        {
            var product = await _productService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = product.Id },
                ApiResponse.SuccessResponse("Operation completed successfully.", product));
        }
        catch (ConflictException ex)
        {
            return Conflict(ApiResponse.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Permissions.Products.Update")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductDto dto)
    {
        try
        {
            var product = await _productService.UpdateAsync(id, dto);
            if (product == null) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
            return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", product));
        }
        catch (ConflictException ex)
        {
            return Conflict(ApiResponse.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Permissions.Products.Delete")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await _productService.DeleteAsync(id);
            if (!deleted) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
            return NoContent();
        }
        catch (ConflictException ex)
        {
            return Conflict(ApiResponse.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Upload a product image. Returns the relative URL for storage in Product.ImageUrl.
    /// Accepts: JPG, JPEG, PNG, WebP. Maximum: 5 MB.
    /// </summary>
    [HttpPost("upload")]
    [HasPermission("Permissions.Products.Update")]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse.ErrorResponse("No file uploaded."));

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(ApiResponse.ErrorResponse("File size exceeds 5 MB limit."));

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
            return BadRequest(ApiResponse.ErrorResponse("Invalid file type. Only JPG, JPEG, PNG, and WebP are allowed."));

        var fileName = $"{Guid.NewGuid()}{extension}";
        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "products");

        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"/uploads/products/{fileName}";
        return Ok(new { url });
    }
}
