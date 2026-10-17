using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.GoodsReceipts.DTOs;
using NovaERP.Application.Interfaces.Services;
using NovaERP.API.Authorization;
using System.Security.Claims;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GoodsReceiptsController : ControllerBase
{
    private readonly IGoodsReceiptService _goodsReceiptService;

    public GoodsReceiptsController(IGoodsReceiptService goodsReceiptService)
    {
        _goodsReceiptService = goodsReceiptService;
    }

    [HttpGet]
    [HasPermission("Permissions.GoodsReceipts.View")]
    public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortOrder = null)
    {
        var result = await _goodsReceiptService.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", result));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Permissions.GoodsReceipts.View")]
    public async Task<IActionResult> Get(Guid id)
    {
        var grn = await _goodsReceiptService.GetByIdAsync(id);
        if (grn == null) return NotFound(ApiResponse.ErrorResponse("Goods Receipt not found."));
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", grn));
    }

    [HttpPost]
    [HasPermission("Permissions.GoodsReceipts.Create")]
    public async Task<IActionResult> Create(CreateGoodsReceiptDto dto)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out Guid userId))
            return Unauthorized(ApiResponse.ErrorResponse("User not authenticated properly."));

        var result = await _goodsReceiptService.CreateAsync(userId, dto);
        return Created($"/api/goodsreceipts/{result.Id}", ApiResponse.SuccessResponse("Operation completed successfully.", result));
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Permissions.GoodsReceipts.Update")]
    public async Task<IActionResult> Update(Guid id, UpdateGoodsReceiptDto dto)
    {
        var result = await _goodsReceiptService.UpdateAsync(id, dto);
        if (result == null) return NotFound(ApiResponse.ErrorResponse("Goods Receipt not found."));
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", result));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Permissions.GoodsReceipts.Delete")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _goodsReceiptService.DeleteAsync(id);
        if (!success) return NotFound(ApiResponse.ErrorResponse("Goods Receipt not found."));
        return NoContent();
    }

    [HttpPost("{id:guid}/receive")]
    [HasPermission("Permissions.GoodsReceipts.Receive")]
    public async Task<IActionResult> Receive(Guid id)
    {
        var result = await _goodsReceiptService.ReceiveAsync(id);
        if (result == null) return NotFound(ApiResponse.ErrorResponse("Goods Receipt not found."));
        return Ok(ApiResponse.SuccessResponse($"Status changed to {result.Status}", result));
    }


    [HttpPost("{id:guid}/cancel")]
    [HasPermission("Permissions.GoodsReceipts.Cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var result = await _goodsReceiptService.CancelAsync(id);
        if (result == null) return NotFound(ApiResponse.ErrorResponse("Goods Receipt not found."));
        return Ok(ApiResponse.SuccessResponse($"Status changed to {result.Status}", result));
    }
}
