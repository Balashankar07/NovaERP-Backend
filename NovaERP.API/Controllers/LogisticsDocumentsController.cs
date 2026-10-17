using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.DTOs.LogisticsDocuments;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Enums;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LogisticsDocumentsController : ControllerBase
{
    private readonly ILogisticsDocumentsService _documentsService;
    private readonly ICurrentUserService _currentUserService;

    public LogisticsDocumentsController(
        ILogisticsDocumentsService documentsService,
        ICurrentUserService currentUserService)
    {
        _documentsService = documentsService;
        _currentUserService = currentUserService;
    }

    [HttpGet("overview")]
    [HasPermission("Permissions.LogisticsDocuments.Reports.View")]
    public async Task<ActionResult<LogisticsDocumentsOverviewDto>> GetOverview()
    {
        var overview = await _documentsService.GetOverviewAsync();
        return Ok(overview);
    }

    // ==========================================
    // PACKING LISTS
    // ==========================================
    [HttpGet("packing-lists")]
    [HasPermission("Permissions.LogisticsDocuments.View")]
    public async Task<ActionResult<List<PackingListDto>>> GetPackingLists(
        [FromQuery] Guid? shipmentId,
        [FromQuery] Guid? salesOrderId)
    {
        var lists = await _documentsService.GetPackingListsAsync(shipmentId, salesOrderId);
        return Ok(lists);
    }

    [HttpGet("packing-lists/{id}")]
    [HasPermission("Permissions.LogisticsDocuments.View")]
    public async Task<ActionResult<PackingListDto>> GetPackingListById(Guid id)
    {
        var packingList = await _documentsService.GetPackingListByIdAsync(id);
        if (packingList == null) return NotFound(new { message = $"Packing List with ID {id} not found." });
        return Ok(packingList);
    }

    [HttpPost("packing-lists")]
    [HasPermission("Permissions.LogisticsDocuments.PackingLists.Create")]
    public async Task<ActionResult<PackingListDto>> CreatePackingList([FromBody] CreatePackingListDto dto)
    {
        var userId = _currentUserService.UserId;
        var created = await _documentsService.CreatePackingListAsync(dto, userId);
        return CreatedAtAction(nameof(GetPackingListById), new { id = created.Id }, created);
    }

    [HttpPut("packing-lists/{id}")]
    [HasPermission("Permissions.LogisticsDocuments.PackingLists.Create")]
    public async Task<ActionResult<PackingListDto>> UpdatePackingList(Guid id, [FromBody] CreatePackingListDto dto)
    {
        var userId = _currentUserService.UserId;
        var updated = await _documentsService.UpdatePackingListAsync(id, dto, userId);
        return Ok(updated);
    }

    [HttpPost("packing-lists/{id}/issue")]
    [HasPermission("Permissions.LogisticsDocuments.PackingLists.Issue")]
    public async Task<ActionResult<PackingListDto>> IssuePackingList(Guid id)
    {
        var userId = _currentUserService.UserId;
        var issued = await _documentsService.IssuePackingListAsync(id, userId);
        return Ok(issued);
    }

    [HttpPost("packing-lists/{id}/cancel")]
    [HasPermission("Permissions.LogisticsDocuments.PackingLists.Cancel")]
    public async Task<ActionResult<PackingListDto>> CancelPackingList(Guid id)
    {
        var userId = _currentUserService.UserId;
        var cancelled = await _documentsService.CancelPackingListAsync(id, userId);
        return Ok(cancelled);
    }

    // ==========================================
    // DELIVERY CHALLANS
    // ==========================================
    [HttpGet("delivery-challans")]
    [HasPermission("Permissions.LogisticsDocuments.View")]
    public async Task<ActionResult<List<DeliveryChallanDto>>> GetDeliveryChallans(
        [FromQuery] Guid? shipmentId,
        [FromQuery] Guid? salesOrderId)
    {
        var challans = await _documentsService.GetDeliveryChallansAsync(shipmentId, salesOrderId);
        return Ok(challans);
    }

    [HttpGet("delivery-challans/{id}")]
    [HasPermission("Permissions.LogisticsDocuments.View")]
    public async Task<ActionResult<DeliveryChallanDto>> GetDeliveryChallanById(Guid id)
    {
        var challan = await _documentsService.GetDeliveryChallanByIdAsync(id);
        if (challan == null) return NotFound(new { message = $"Delivery Challan with ID {id} not found." });
        return Ok(challan);
    }

    [HttpPost("delivery-challans")]
    [HasPermission("Permissions.LogisticsDocuments.DeliveryChallans.Create")]
    public async Task<ActionResult<DeliveryChallanDto>> CreateDeliveryChallan([FromBody] CreateDeliveryChallanDto dto)
    {
        var userId = _currentUserService.UserId;
        var created = await _documentsService.CreateDeliveryChallanAsync(dto, userId);
        return CreatedAtAction(nameof(GetDeliveryChallanById), new { id = created.Id }, created);
    }

    [HttpPut("delivery-challans/{id}")]
    [HasPermission("Permissions.LogisticsDocuments.DeliveryChallans.Create")]
    public async Task<ActionResult<DeliveryChallanDto>> UpdateDeliveryChallan(Guid id, [FromBody] CreateDeliveryChallanDto dto)
    {
        var userId = _currentUserService.UserId;
        var updated = await _documentsService.UpdateDeliveryChallanAsync(id, dto, userId);
        return Ok(updated);
    }

    [HttpPost("delivery-challans/{id}/issue")]
    [HasPermission("Permissions.LogisticsDocuments.DeliveryChallans.Issue")]
    public async Task<ActionResult<DeliveryChallanDto>> IssueDeliveryChallan(Guid id)
    {
        var userId = _currentUserService.UserId;
        var issued = await _documentsService.IssueDeliveryChallanAsync(id, userId);
        return Ok(issued);
    }

    [HttpPost("delivery-challans/{id}/cancel")]
    [HasPermission("Permissions.LogisticsDocuments.DeliveryChallans.Cancel")]
    public async Task<ActionResult<DeliveryChallanDto>> CancelDeliveryChallan(Guid id)
    {
        var userId = _currentUserService.UserId;
        var cancelled = await _documentsService.CancelDeliveryChallanAsync(id, userId);
        return Ok(cancelled);
    }

    // ==========================================
    // SHIPMENT DOCUMENTS
    // ==========================================
    [HttpGet("shipments/{shipmentId}/documents")]
    [HasPermission("Permissions.LogisticsDocuments.View")]
    public async Task<ActionResult<List<ShipmentDocumentDto>>> GetShipmentDocuments(Guid shipmentId)
    {
        var docs = await _documentsService.GetShipmentDocumentsAsync(shipmentId);
        return Ok(docs);
    }

    [HttpPost("shipments/{shipmentId}/documents")]
    [HasPermission("Permissions.LogisticsDocuments.View")]
    public async Task<ActionResult<ShipmentDocumentDto>> GenerateShipmentDocumentReference(
        Guid shipmentId,
        [FromQuery] LogisticsDocumentType documentType,
        [FromQuery] Guid? targetDocumentId)
    {
        var userId = _currentUserService.UserId;
        var doc = await _documentsService.GenerateShipmentDocumentReferenceAsync(shipmentId, documentType, targetDocumentId, userId);
        return Ok(doc);
    }
}
