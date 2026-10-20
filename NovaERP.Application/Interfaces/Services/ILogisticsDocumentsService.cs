using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NovaERP.Application.DTOs.LogisticsDocuments;

namespace NovaERP.Application.Interfaces.Services;

public interface ILogisticsDocumentsService
{
    // Overview / Summary
    Task<LogisticsDocumentsOverviewDto> GetOverviewAsync();

    // Packing Lists
    Task<List<PackingListDto>> GetPackingListsAsync(Guid? shipmentId = null, Guid? salesOrderId = null);
    Task<PackingListDto?> GetPackingListByIdAsync(Guid id);
    Task<PackingListDto> CreatePackingListAsync(CreatePackingListDto dto, Guid? userId = null);
    Task<PackingListDto> UpdatePackingListAsync(Guid id, CreatePackingListDto dto, Guid? userId = null);
    Task<PackingListDto> IssuePackingListAsync(Guid id, Guid? userId = null);
    Task<PackingListDto> CancelPackingListAsync(Guid id, Guid? userId = null);

    // Delivery Challans
    Task<List<DeliveryChallanDto>> GetDeliveryChallansAsync(Guid? shipmentId = null, Guid? salesOrderId = null);
    Task<DeliveryChallanDto?> GetDeliveryChallanByIdAsync(Guid id);
    Task<DeliveryChallanDto> CreateDeliveryChallanAsync(CreateDeliveryChallanDto dto, Guid? userId = null);
    Task<DeliveryChallanDto> UpdateDeliveryChallanAsync(Guid id, CreateDeliveryChallanDto dto, Guid? userId = null);
    Task<DeliveryChallanDto> IssueDeliveryChallanAsync(Guid id, Guid? userId = null);
    Task<DeliveryChallanDto> CancelDeliveryChallanAsync(Guid id, Guid? userId = null);

    // Shipment Documents
    Task<List<ShipmentDocumentDto>> GetShipmentDocumentsAsync(Guid shipmentId);
    Task<ShipmentDocumentDto> GenerateShipmentDocumentReferenceAsync(Guid shipmentId, Domain.Enums.LogisticsDocumentType documentType, Guid? targetDocumentId = null, Guid? userId = null);
}
