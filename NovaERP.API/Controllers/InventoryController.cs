using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly IInventoryMovementService _inventoryMovementService;
    private readonly ICurrentUserService _currentUserService;

    public InventoryController(IInventoryService inventoryService, IInventoryMovementService inventoryMovementService, ICurrentUserService currentUserService)
    {
        _inventoryService = inventoryService;
        _inventoryMovementService = inventoryMovementService;
        _currentUserService = currentUserService;
    }

    /// <summary>GET /api/Inventory — Paginated list with optional search and sort.</summary>
    [HttpGet]
    [HasPermission("Permissions.Inventory.View")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortOrder = null)
    {
        var result = await _inventoryService.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        return Ok(new ApiResponse<object>(true, "Inventory records retrieved successfully.", result));
    }

    /// <summary>GET /api/Inventory/{id} — Single inventory record by ID.</summary>
    [HttpGet("{id:guid}")]
    [HasPermission("Permissions.Inventory.View")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var inventory = await _inventoryService.GetByIdAsync(id);
        if (inventory == null)
            return NotFound(new ApiResponse<object>(false, "Inventory record not found.", null));

        return Ok(new ApiResponse<object>(true, "Inventory record retrieved successfully.", inventory));
    }

    /// <summary>GET /api/Inventory/by-product/{productId} — All inventory records for a product across warehouses.</summary>
    [HttpGet("by-product/{productId:guid}")]
    [HasPermission("Permissions.Inventory.View")]
    public async Task<IActionResult> GetByProduct(Guid productId)
    {
        var inventories = await _inventoryService.GetByProductIdAsync(productId);
        return Ok(new ApiResponse<object>(true, "Inventory records for product retrieved successfully.", inventories));
    }

    /// <summary>GET /api/Inventory/by-warehouse/{warehouseId} — Paginated inventory for a specific warehouse.</summary>
    [HttpGet("by-warehouse/{warehouseId:guid}")]
    [HasPermission("Permissions.Inventory.View")]
    public async Task<IActionResult> GetByWarehouse(
        Guid warehouseId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortOrder = null)
    {
        var result = await _inventoryService.GetByWarehouseIdAsync(warehouseId, pageNumber, pageSize, search, sortBy, sortOrder);
        return Ok(new ApiResponse<object>(true, "Inventory records for warehouse retrieved successfully.", result));
    }

    /// <summary>GET /api/Inventory/{id}/transactions — Paginated transaction log for an inventory record.</summary>
    [HttpGet("{id:guid}/transactions")]
    [HasPermission("Permissions.Inventory.Transactions.View")]
    public async Task<IActionResult> GetTransactions(
        Guid id,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _inventoryService.GetTransactionsAsync(id, pageNumber, pageSize);
        return Ok(new ApiResponse<object>(true, "Inventory transactions retrieved successfully.", result));
    }

    /// <summary>GET /api/Inventory/transactions — Paginated global transaction log.</summary>
    [HttpGet("transactions")]
    [HasPermission("Permissions.Inventory.Transactions.View")]
    public async Task<IActionResult> GetAllTransactions(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? transactionType = null,
        [FromQuery] Guid? warehouseId = null,
        [FromQuery] Guid? productId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var result = await _inventoryService.GetAllTransactionsAsync(pageNumber, pageSize, search, transactionType, warehouseId, productId, startDate, endDate);
        return Ok(new ApiResponse<object>(true, "Inventory transactions retrieved successfully.", result));
    }

    [HttpPost("receive")]
    [HasPermission("Permissions.Inventory.Adjust")]
    public async Task<IActionResult> Receive([FromBody] NovaERP.Application.Features.Inventory.DTOs.ReceiveStockDto dto)
    {
        await _inventoryMovementService.ReceiveAsync(dto.ProductId, dto.WarehouseId, dto.LocationId, dto.Quantity, dto.ReferenceType, dto.ReferenceId, dto.Remarks, _currentUserService.UserId);
        return Ok(ApiResponse.SuccessResponse("Stock received successfully."));
    }

    [HttpPost("issue")]
    [HasPermission("Permissions.Inventory.Adjust")]
    public async Task<IActionResult> Issue([FromBody] NovaERP.Application.Features.Inventory.DTOs.IssueStockDto dto)
    {
        await _inventoryMovementService.IssueAsync(dto.ProductId, dto.WarehouseId, dto.LocationId, dto.Quantity, dto.ReferenceType, dto.ReferenceId, dto.Remarks, _currentUserService.UserId);
        return Ok(ApiResponse.SuccessResponse("Stock issued successfully."));
    }

    [HttpPost("reserve")]
    [HasPermission("Permissions.Inventory.Adjust")]
    public async Task<IActionResult> Reserve([FromBody] NovaERP.Application.Features.Inventory.DTOs.ReserveStockDto dto)
    {
        await _inventoryMovementService.ReserveAsync(dto.ProductId, dto.WarehouseId, dto.LocationId, dto.Quantity, dto.ReferenceType, dto.ReferenceId, dto.Remarks, _currentUserService.UserId);
        return Ok(ApiResponse.SuccessResponse("Stock reserved successfully."));
    }

    [HttpPost("release-reservation")]
    [HasPermission("Permissions.Inventory.Adjust")]
    public async Task<IActionResult> ReleaseReservation([FromBody] NovaERP.Application.Features.Inventory.DTOs.ReleaseReservationDto dto)
    {
        await _inventoryMovementService.ReleaseReservationAsync(dto.ProductId, dto.WarehouseId, dto.LocationId, dto.Quantity, dto.ReferenceType, dto.ReferenceId, dto.Remarks, _currentUserService.UserId);
        return Ok(ApiResponse.SuccessResponse("Stock reservation released successfully."));
    }

    [HttpPost("adjust")]
    [HasPermission("Permissions.Inventory.Adjust")]
    public async Task<IActionResult> Adjust([FromBody] NovaERP.Application.Features.Inventory.DTOs.AdjustStockDto dto)
    {
        await _inventoryMovementService.AdjustAsync(dto.ProductId, dto.WarehouseId, dto.LocationId, dto.QuantityDelta, dto.Reason, _currentUserService.UserId);
        return Ok(ApiResponse.SuccessResponse("Stock adjusted successfully."));
    }

    [HttpPost("transfer")]
    [HasPermission("Permissions.Inventory.Transfer")]
    public async Task<IActionResult> Transfer([FromBody] NovaERP.Application.Features.Inventory.DTOs.TransferStockDto dto)
    {
        await _inventoryMovementService.TransferAsync(dto.ProductId, dto.SourceWarehouseId, dto.SourceLocationId, dto.DestinationWarehouseId, dto.DestinationLocationId, dto.Quantity, dto.Reason, _currentUserService.UserId);
        return Ok(ApiResponse.SuccessResponse("Stock transferred successfully."));
    }
}
