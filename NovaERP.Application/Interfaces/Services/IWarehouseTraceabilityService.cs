using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Inventory.DTOs;
using NovaERP.Domain.Enums;

namespace NovaERP.Application.Interfaces.Services;

public interface IWarehouseTraceabilityService
{
    // Location Hierarchy
    Task<List<HierarchicalLocationDto>> GetLocationHierarchyAsync(Guid warehouseId);
    Task<HierarchicalLocationDto> CreateLocationAsync(CreateHierarchicalLocationDto dto, Guid? currentUserId);

    // Product Tracking Configuration
    Task UpdateProductTrackingModeAsync(Guid productId, TrackingMode mode, Guid? currentUserId);

    // Batch Management
    Task<PagedResult<InventoryBatchDto>> GetBatchesAsync(int pageNumber, int pageSize, Guid? productId, Guid? warehouseId, BatchStatus? status);
    Task<InventoryBatchDto> CreateBatchAsync(CreateInventoryBatchDto dto, Guid? currentUserId);
    Task<InventoryBatchDto> UpdateBatchStatusAsync(Guid batchId, BatchStatus status, string? remarks, Guid? currentUserId);

    // Serial Management
    Task<PagedResult<InventorySerialNumberDto>> GetSerialsAsync(int pageNumber, int pageSize, Guid? productId, Guid? warehouseId, SerialStatus? status);
    Task<List<InventorySerialNumberDto>> RegisterSerialsAsync(RegisterSerialNumbersDto dto, Guid? currentUserId);
    Task<InventorySerialNumberDto> UpdateSerialStatusAsync(Guid serialId, SerialStatus status, string? remarks, Guid? currentUserId);

    // Damaged / Blocked Stock Queries
    Task<PagedResult<InventoryBatchDto>> GetDamagedOrBlockedBatchesAsync(int pageNumber, int pageSize);
    Task<PagedResult<InventorySerialNumberDto>> GetDamagedOrBlockedSerialsAsync(int pageNumber, int pageSize);

    // Traceability Timeline & Reports
    Task<TraceabilityNodeDto> GetProductTraceabilityAsync(Guid productId);
    Task<TraceabilityReportsSummaryDto> GetReportsSummaryAsync();
}
