using Microsoft.EntityFrameworkCore;
using NovaERP.Application.DTOs.Returns;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Services;

public class ReturnsService : IReturnsService
{
    private readonly AppDbContext _context;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IInventoryMovementService _inventoryMovement;
    private readonly IAuditLogger _auditLogger;

    public ReturnsService(
        AppDbContext context,
        IUnitOfWork unitOfWork,
        IInventoryMovementService inventoryMovement,
        IAuditLogger auditLogger)
    {
        _context = context;
        _unitOfWork = unitOfWork;
        _inventoryMovement = inventoryMovement;
        _auditLogger = auditLogger;
    }

    #region Customer Returns

    public async Task<CustomerReturnDto> CreateReturnAsync(CreateCustomerReturnDto dto, Guid? currentUserId)
    {
        // 1. Validate Customer
        var customer = await _context.Distributors.FirstOrDefaultAsync(d => d.Id == dto.CustomerId);
        if (customer == null || !customer.IsActive)
            throw new InvalidOperationException($"Customer (Distributor) {dto.CustomerId} not found or inactive.");

        // 2. Validate SalesOrder
        var salesOrder = await _context.SalesOrders
            .Include(so => so.SalesOrderItems)
            .FirstOrDefaultAsync(so => so.Id == dto.SalesOrderId);
        
        if (salesOrder == null)
            throw new InvalidOperationException($"SalesOrder {dto.SalesOrderId} not found.");

        if (salesOrder.DistributorId != dto.CustomerId)
            throw new InvalidOperationException($"SalesOrder {dto.SalesOrderId} does not belong to Customer {dto.CustomerId}.");

        if (salesOrder.Status != SalesOrderStatus.Completed && 
            salesOrder.Status != SalesOrderStatus.PartiallyShipped && 
            salesOrder.Status != SalesOrderStatus.ReadyToShip &&
            salesOrder.Status != SalesOrderStatus.Approved)
        {
            throw new InvalidOperationException($"Cannot create return for SalesOrder in '{salesOrder.Status}' status. Order must be completed/shipped.");
        }

        // 3. Validate Shipment if specified
        if (dto.ShipmentId.HasValue)
        {
            var shipment = await _context.Shipments.FirstOrDefaultAsync(s => s.Id == dto.ShipmentId.Value);
            if (shipment == null)
                throw new InvalidOperationException($"Shipment {dto.ShipmentId.Value} not found.");
            if (shipment.SalesOrderId != dto.SalesOrderId)
                throw new InvalidOperationException($"Shipment {dto.ShipmentId.Value} does not belong to SalesOrder {dto.SalesOrderId}.");
        }

        // 4. Validate Items
        if (dto.Items == null || !dto.Items.Any())
            throw new InvalidOperationException("At least one item must be included in the customer return request.");

        foreach (var item in dto.Items)
        {
            var orderItem = salesOrder.SalesOrderItems.FirstOrDefault(soi => soi.ProductId == item.ProductId);
            if (orderItem == null)
                throw new InvalidOperationException($"Product {item.ProductId} was not delivered in SalesOrder {salesOrder.OrderNumber}.");

            if (item.Quantity <= 0)
                throw new ArgumentException($"Return quantity for Product {item.ProductId} must be greater than zero.");

            if (item.Quantity > orderItem.Quantity)
                throw new InvalidOperationException($"Return quantity ({item.Quantity}) exceeds ordered quantity ({orderItem.Quantity}) for Product {item.ProductId}.");

            // Check duplicate active return for serial if specified
            if (!string.IsNullOrWhiteSpace(item.SerialNumber))
            {
                bool existingActiveReturn = await _context.CustomerReturnItems
                    .Include(cri => cri.CustomerReturn)
                    .AnyAsync(cri => cri.SerialNumber == item.SerialNumber.Trim() && 
                                     cri.CustomerReturn != null &&
                                     cri.CustomerReturn.SalesOrderId == dto.SalesOrderId &&
                                     cri.CustomerReturn.Status != CustomerReturnStatus.Cancelled &&
                                     cri.CustomerReturn.Status != CustomerReturnStatus.Rejected);

                if (existingActiveReturn)
                    throw new InvalidOperationException($"An active return request already exists for Serial Number '{item.SerialNumber.Trim()}' on SalesOrder {salesOrder.OrderNumber}.");
            }
        }

        // 5. Build Entity
        string returnNumber = $"RET-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}";

        var customerReturn = new CustomerReturn
        {
            ReturnNumber = returnNumber,
            CustomerId = dto.CustomerId,
            SalesOrderId = dto.SalesOrderId,
            ShipmentId = dto.ShipmentId,
            WarrantyClaimId = dto.WarrantyClaimId,
            Reason = dto.Reason,
            RequestedDate = DateTime.UtcNow,
            Status = CustomerReturnStatus.Draft,
            Notes = dto.Notes,
            CreatedByUserId = currentUserId,
            CreatedAt = DateTime.UtcNow,
            Items = dto.Items.Select(i => new CustomerReturnItem
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                SerialNumber = i.SerialNumber?.Trim(),
                BatchNumber = i.BatchNumber?.Trim(),
                Reason = i.Reason,
                Condition = i.Condition,
                CreatedAt = DateTime.UtcNow
            }).ToList()
        };

        _context.CustomerReturns.Add(customerReturn);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Create", "CustomerReturn", customerReturn.Id.ToString(), newValues: $"Return {returnNumber} created for Customer {customer.CompanyName}");

        return (await GetReturnByIdAsync(customerReturn.Id))!;
    }

    public async Task<CustomerReturnDto?> GetReturnByIdAsync(Guid id)
    {
        var entity = await _context.CustomerReturns
            .Include(r => r.Customer)
            .Include(r => r.SalesOrder)
            .Include(r => r.Shipment)
            .Include(r => r.CreatedByUser)
            .Include(r => r.Items).ThenInclude(i => i.Product)
            .Include(r => r.RMA).ThenInclude(rma => rma!.AuthorizedByUser)
            .Include(r => r.Receipts).ThenInclude(rec => rec.Product)
            .Include(r => r.Receipts).ThenInclude(rec => rec.Warehouse)
            .Include(r => r.Receipts).ThenInclude(rec => rec.ReceivedByUser)
            .Include(r => r.Dispositions).ThenInclude(d => d.Product)
            .Include(r => r.Dispositions).ThenInclude(d => d.ApprovedByUser)
            .Include(r => r.Repairs).ThenInclude(rep => rep.Product)
            .Include(r => r.Repairs).ThenInclude(rep => rep.AssignedEmployee).ThenInclude(emp => emp!.User)
            .Include(r => r.Repairs).ThenInclude(rep => rep.WorkCenter)
            .Include(r => r.Replacements).ThenInclude(rep => rep.Product)
            .Include(r => r.Replacements).ThenInclude(rep => rep.Warehouse)
            .Include(r => r.Replacements).ThenInclude(rep => rep.Shipment)
            .FirstOrDefaultAsync(r => r.Id == id);

        return entity == null ? null : MapToReturnDto(entity);
    }

    public async Task<IEnumerable<CustomerReturnDto>> GetAllReturnsAsync(CustomerReturnStatus? status = null, Guid? customerId = null)
    {
        var query = _context.CustomerReturns
            .Include(r => r.Customer)
            .Include(r => r.SalesOrder)
            .Include(r => r.Shipment)
            .Include(r => r.CreatedByUser)
            .Include(r => r.Items).ThenInclude(i => i.Product)
            .Include(r => r.RMA)
            .AsNoTracking();

        if (status.HasValue)
            query = query.Where(r => r.Status == status.Value);

        if (customerId.HasValue)
            query = query.Where(r => r.CustomerId == customerId.Value);

        var list = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return list.Select(MapToReturnDto);
    }

    public async Task<CustomerReturnDto> UpdateReturnAsync(Guid id, UpdateCustomerReturnDto dto, Guid? currentUserId)
    {
        var entity = await _context.CustomerReturns.FirstOrDefaultAsync(r => r.Id == id);
        if (entity == null)
            throw new InvalidOperationException($"CustomerReturn {id} not found.");

        if (entity.Status == CustomerReturnStatus.Closed || entity.Status == CustomerReturnStatus.Cancelled)
            throw new InvalidOperationException($"Closed or Cancelled return {entity.ReturnNumber} cannot be edited.");

        entity.Reason = dto.Reason;
        entity.Notes = dto.Notes;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.UpdatedBy = currentUserId;

        _context.CustomerReturns.Update(entity);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Update", "CustomerReturn", id.ToString(), newValues: $"Updated return {entity.ReturnNumber}");

        return (await GetReturnByIdAsync(id))!;
    }

    public async Task<CustomerReturnDto> SubmitReturnAsync(Guid id, Guid? currentUserId)
    {
        var entity = await _context.CustomerReturns.FirstOrDefaultAsync(r => r.Id == id);
        if (entity == null)
            throw new InvalidOperationException($"CustomerReturn {id} not found.");

        if (entity.Status != CustomerReturnStatus.Draft)
            throw new InvalidOperationException($"Return {entity.ReturnNumber} is in '{entity.Status}' status and cannot be submitted.");

        entity.Status = CustomerReturnStatus.Submitted;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.UpdatedBy = currentUserId;

        _context.CustomerReturns.Update(entity);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Submit", "CustomerReturn", id.ToString(), newValues: $"Submitted return {entity.ReturnNumber}");

        return (await GetReturnByIdAsync(id))!;
    }

    public async Task<CustomerReturnDto> ApproveReturnAsync(Guid id, Guid? currentUserId)
    {
        var entity = await _context.CustomerReturns
            .Include(r => r.RMA)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (entity == null)
            throw new InvalidOperationException($"CustomerReturn {id} not found.");

        if (entity.Status != CustomerReturnStatus.Submitted)
            throw new InvalidOperationException($"Return {entity.ReturnNumber} must be in 'Submitted' status to approve.");

        entity.Status = CustomerReturnStatus.Approved;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.UpdatedBy = currentUserId;

        // Auto-create RMA if not exists
        if (entity.RMA == null)
        {
            string rmaNumber = $"RMA-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}";
            var rma = new ReturnAuthorization
            {
                RmaNumber = rmaNumber,
                CustomerReturnId = entity.Id,
                AuthorizedByUserId = currentUserId,
                AuthorizationDate = DateTime.UtcNow,
                Status = RmaStatus.Approved,
                Reason = "Auto-approved upon Return Request Approval",
                CreatedAt = DateTime.UtcNow
            };
            _context.ReturnAuthorizations.Add(rma);
        }
        else
        {
            entity.RMA.Status = RmaStatus.Approved;
            entity.RMA.AuthorizedByUserId = currentUserId;
            entity.RMA.AuthorizationDate = DateTime.UtcNow;
            _context.ReturnAuthorizations.Update(entity.RMA);
        }

        // If linked to WarrantyClaim, update claim status
        if (entity.WarrantyClaimId.HasValue)
        {
            var claim = await _context.WarrantyClaims.FirstOrDefaultAsync(wc => wc.Id == entity.WarrantyClaimId.Value);
            if (claim != null && claim.Status == WarrantyClaimStatus.Pending)
            {
                claim.Status = WarrantyClaimStatus.Approved;
                claim.Resolution = $"RMA Approved via Return {entity.ReturnNumber}";
                _context.WarrantyClaims.Update(claim);
            }
        }

        _context.CustomerReturns.Update(entity);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Approve", "CustomerReturn", id.ToString(), newValues: $"Approved return {entity.ReturnNumber} & authorized RMA");

        return (await GetReturnByIdAsync(id))!;
    }

    public async Task<CustomerReturnDto> RejectReturnAsync(Guid id, string reason, Guid? currentUserId)
    {
        var entity = await _context.CustomerReturns.FirstOrDefaultAsync(r => r.Id == id);
        if (entity == null)
            throw new InvalidOperationException($"CustomerReturn {id} not found.");

        if (entity.Status == CustomerReturnStatus.Closed || entity.Status == CustomerReturnStatus.Cancelled)
            throw new InvalidOperationException($"Cannot reject closed/cancelled return {entity.ReturnNumber}.");

        entity.Status = CustomerReturnStatus.Rejected;
        entity.Notes = string.IsNullOrWhiteSpace(entity.Notes) ? $"Rejected: {reason}" : $"{entity.Notes}\nRejected: {reason}";
        entity.UpdatedAt = DateTime.UtcNow;
        entity.UpdatedBy = currentUserId;

        // Reject RMA if present
        var rma = await _context.ReturnAuthorizations.FirstOrDefaultAsync(r => r.CustomerReturnId == id);
        if (rma != null)
        {
            rma.Status = RmaStatus.Rejected;
            rma.Reason = reason;
            _context.ReturnAuthorizations.Update(rma);
        }

        // If linked to WarrantyClaim, update claim status
        if (entity.WarrantyClaimId.HasValue)
        {
            var claim = await _context.WarrantyClaims.FirstOrDefaultAsync(wc => wc.Id == entity.WarrantyClaimId.Value);
            if (claim != null)
            {
                claim.Status = WarrantyClaimStatus.Rejected;
                claim.Resolution = $"Return {entity.ReturnNumber} rejected: {reason}";
                _context.WarrantyClaims.Update(claim);
            }
        }

        _context.CustomerReturns.Update(entity);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Reject", "CustomerReturn", id.ToString(), newValues: $"Rejected return {entity.ReturnNumber}: {reason}");

        return (await GetReturnByIdAsync(id))!;
    }

    public async Task<CustomerReturnDto> CloseReturnAsync(Guid id, Guid? currentUserId)
    {
        var entity = await _context.CustomerReturns.FirstOrDefaultAsync(r => r.Id == id);
        if (entity == null)
            throw new InvalidOperationException($"CustomerReturn {id} not found.");

        if (entity.Status == CustomerReturnStatus.Cancelled)
            throw new InvalidOperationException($"Cancelled return {entity.ReturnNumber} cannot be closed.");

        entity.Status = CustomerReturnStatus.Closed;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.UpdatedBy = currentUserId;

        // If linked to WarrantyClaim, update claim status to Resolved / Closed
        if (entity.WarrantyClaimId.HasValue)
        {
            var claim = await _context.WarrantyClaims.FirstOrDefaultAsync(wc => wc.Id == entity.WarrantyClaimId.Value);
            if (claim != null && claim.Status != WarrantyClaimStatus.Closed)
            {
                claim.Status = WarrantyClaimStatus.Closed;
                claim.Resolution = $"Completed via Return Workflow {entity.ReturnNumber}";
                _context.WarrantyClaims.Update(claim);
            }
        }

        _context.CustomerReturns.Update(entity);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Close", "CustomerReturn", id.ToString(), newValues: $"Closed return {entity.ReturnNumber}");

        return (await GetReturnByIdAsync(id))!;
    }

    public async Task<CustomerReturnDto> CancelReturnAsync(Guid id, Guid? currentUserId)
    {
        var entity = await _context.CustomerReturns.FirstOrDefaultAsync(r => r.Id == id);
        if (entity == null)
            throw new InvalidOperationException($"CustomerReturn {id} not found.");

        if (entity.Status == CustomerReturnStatus.Closed)
            throw new InvalidOperationException($"Closed return {entity.ReturnNumber} cannot be cancelled.");

        entity.Status = CustomerReturnStatus.Cancelled;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.UpdatedBy = currentUserId;

        _context.CustomerReturns.Update(entity);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Cancel", "CustomerReturn", id.ToString(), newValues: $"Cancelled return {entity.ReturnNumber}");

        return (await GetReturnByIdAsync(id))!;
    }

    #endregion

    #region RMA Authorization

    public async Task<ReturnAuthorizationDto> CreateRmaAsync(CreateRmaDto dto, Guid? currentUserId)
    {
        var customerReturn = await _context.CustomerReturns.FirstOrDefaultAsync(r => r.Id == dto.CustomerReturnId);
        if (customerReturn == null)
            throw new InvalidOperationException($"CustomerReturn {dto.CustomerReturnId} not found.");

        var existingRma = await _context.ReturnAuthorizations.FirstOrDefaultAsync(r => r.CustomerReturnId == dto.CustomerReturnId);
        if (existingRma != null)
            return MapToRmaDto(existingRma);

        string rmaNumber = $"RMA-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}";
        var rma = new ReturnAuthorization
        {
            RmaNumber = rmaNumber,
            CustomerReturnId = dto.CustomerReturnId,
            AuthorizedByUserId = currentUserId,
            AuthorizationDate = DateTime.UtcNow,
            Status = RmaStatus.Submitted,
            Instructions = dto.Instructions,
            CreatedAt = DateTime.UtcNow
        };

        _context.ReturnAuthorizations.Add(rma);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("CreateRma", "ReturnAuthorization", rma.Id.ToString(), newValues: $"Created RMA {rmaNumber} for Return {customerReturn.ReturnNumber}");

        return MapToRmaDto(rma);
    }

    public async Task<ReturnAuthorizationDto> AuthorizeRmaAsync(Guid id, AuthorizeRmaDto dto, Guid? currentUserId)
    {
        var rma = await _context.ReturnAuthorizations
            .Include(r => r.CustomerReturn)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (rma == null)
            throw new InvalidOperationException($"ReturnAuthorization {id} not found.");

        rma.Status = dto.Approve ? RmaStatus.Approved : RmaStatus.Rejected;
        rma.Reason = dto.Reason;
        rma.Instructions = dto.Instructions;
        rma.AuthorizedByUserId = currentUserId;
        rma.AuthorizationDate = DateTime.UtcNow;
        rma.UpdatedAt = DateTime.UtcNow;

        if (rma.CustomerReturn != null)
        {
            rma.CustomerReturn.Status = dto.Approve ? CustomerReturnStatus.Approved : CustomerReturnStatus.Rejected;
            _context.CustomerReturns.Update(rma.CustomerReturn);
        }

        _context.ReturnAuthorizations.Update(rma);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("AuthorizeRma", "ReturnAuthorization", id.ToString(), newValues: $"RMA {rma.RmaNumber} {(dto.Approve ? "Approved" : "Rejected")}");

        return MapToRmaDto(rma);
    }

    public async Task<ReturnAuthorizationDto?> GetRmaByIdAsync(Guid id)
    {
        var rma = await _context.ReturnAuthorizations
            .Include(r => r.CustomerReturn)
            .Include(r => r.AuthorizedByUser)
            .FirstOrDefaultAsync(r => r.Id == id);

        return rma == null ? null : MapToRmaDto(rma);
    }

    public async Task<IEnumerable<ReturnAuthorizationDto>> GetAllRmasAsync(RmaStatus? status = null)
    {
        var query = _context.ReturnAuthorizations
            .Include(r => r.CustomerReturn)
            .Include(r => r.AuthorizedByUser)
            .AsNoTracking();

        if (status.HasValue)
            query = query.Where(r => r.Status == status.Value);

        var list = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return list.Select(MapToRmaDto);
    }

    #endregion

    #region Return Receipt

    public async Task<ReturnReceiptDto> CreateReceiptAsync(CreateReturnReceiptDto dto, Guid? currentUserId)
    {
        // Validate CustomerReturn
        var customerReturn = await _context.CustomerReturns
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == dto.CustomerReturnId);

        if (customerReturn == null)
            throw new InvalidOperationException($"CustomerReturn {dto.CustomerReturnId} not found.");

        if (customerReturn.Status != CustomerReturnStatus.Approved && customerReturn.Status != CustomerReturnStatus.Received)
            throw new InvalidOperationException($"Return {customerReturn.ReturnNumber} must be Approved before receiving goods.");

        // Validate Warehouse & Product
        var warehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == dto.WarehouseId);
        if (warehouse == null)
            throw new InvalidOperationException($"Warehouse {dto.WarehouseId} not found.");

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == dto.ProductId);
        if (product == null)
            throw new InvalidOperationException($"Product {dto.ProductId} not found.");

        // Validate Quantity against return request
        var returnItem = customerReturn.Items.FirstOrDefault(i => i.ProductId == dto.ProductId);
        if (returnItem == null)
            throw new InvalidOperationException($"Product {product.Name} is not part of Return Request {customerReturn.ReturnNumber}.");

        decimal existingReceivedQty = await _context.ReturnReceipts
            .Where(r => r.CustomerReturnId == dto.CustomerReturnId && r.ProductId == dto.ProductId)
            .SumAsync(r => (decimal?)r.Quantity) ?? 0m;

        if (existingReceivedQty + dto.Quantity > returnItem.Quantity)
        {
            throw new InvalidOperationException($"Receipt quantity ({dto.Quantity}) + previously received ({existingReceivedQty}) exceeds authorized return quantity ({returnItem.Quantity}).");
        }

        // Physical stock update: Product enters warehouse via InventoryMovementService (SalesReturn)
        var invDto = await _inventoryMovement.ReceiveAsync(
            dto.ProductId,
            dto.WarehouseId,
            dto.WarehouseLocationId,
            dto.Quantity,
            InventoryReferenceType.SalesOrder,
            customerReturn.SalesOrderId,
            $"Return Receipt for {customerReturn.ReturnNumber}",
            currentUserId
        );

        // Serial traceability update
        if (!string.IsNullOrWhiteSpace(dto.SerialNumber))
        {
            var serial = await _context.InventorySerialNumbers
                .FirstOrDefaultAsync(s => s.SerialNumber == dto.SerialNumber.Trim() && s.ProductId == dto.ProductId);

            if (serial != null)
            {
                serial.Status = SerialStatus.Returned;
                serial.WarehouseId = dto.WarehouseId;
                serial.WarehouseLocationId = dto.WarehouseLocationId;
                serial.CurrentReferenceType = InventoryReferenceType.SalesOrder;
                serial.CurrentReferenceId = customerReturn.SalesOrderId;
                serial.UpdatedAt = DateTime.UtcNow;
                _context.InventorySerialNumbers.Update(serial);
            }
        }

        // Quality Inspection integration
        QualityInspection? qualityInspection = null;
        if (dto.TriggerQualityInspection)
        {
            qualityInspection = new QualityInspection
            {
                InspectionNumber = $"INS-RET-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}",
                ProductId = dto.ProductId,
                InspectedQuantity = dto.Quantity,
                Status = QualityInspectionStatus.Draft,
                Remarks = $"Auto-triggered inspection for Return Receipt {customerReturn.ReturnNumber}. Serial: {dto.SerialNumber}, Batch: {dto.BatchNumber}",
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.QualityInspections.Add(qualityInspection);
            await _context.SaveChangesAsync();
        }

        string receiptNumber = $"REC-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}";

        var receipt = new ReturnReceipt
        {
            ReceiptNumber = receiptNumber,
            CustomerReturnId = dto.CustomerReturnId,
            ReturnAuthorizationId = dto.ReturnAuthorizationId,
            WarehouseId = dto.WarehouseId,
            WarehouseLocationId = dto.WarehouseLocationId,
            ProductId = dto.ProductId,
            ReceivedByUserId = currentUserId,
            ReceivedDate = DateTime.UtcNow,
            Quantity = dto.Quantity,
            SerialNumber = dto.SerialNumber?.Trim(),
            BatchNumber = dto.BatchNumber?.Trim(),
            Condition = dto.Condition,
            Notes = dto.Notes,
            QualityInspectionId = qualityInspection?.Id,
            CreatedAt = DateTime.UtcNow
        };

        customerReturn.Status = CustomerReturnStatus.Received;
        customerReturn.UpdatedAt = DateTime.UtcNow;
        _context.CustomerReturns.Update(customerReturn);

        _context.ReturnReceipts.Add(receipt);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("CreateReceipt", "ReturnReceipt", receipt.Id.ToString(), newValues: $"Received {dto.Quantity} x {product.ProductCode} at Warehouse {warehouse.WarehouseName}");

        return (await GetReceiptByIdAsync(receipt.Id))!;
    }

    public async Task<ReturnReceiptDto?> GetReceiptByIdAsync(Guid id)
    {
        var receipt = await _context.ReturnReceipts
            .Include(r => r.CustomerReturn)
            .Include(r => r.ReturnAuthorization)
            .Include(r => r.Warehouse)
            .Include(r => r.WarehouseLocation)
            .Include(r => r.Product)
            .Include(r => r.ReceivedByUser)
            .Include(r => r.QualityInspection)
            .FirstOrDefaultAsync(r => r.Id == id);

        return receipt == null ? null : MapToReceiptDto(receipt);
    }

    public async Task<IEnumerable<ReturnReceiptDto>> GetAllReceiptsAsync(Guid? customerReturnId = null)
    {
        var query = _context.ReturnReceipts
            .Include(r => r.CustomerReturn)
            .Include(r => r.ReturnAuthorization)
            .Include(r => r.Warehouse)
            .Include(r => r.WarehouseLocation)
            .Include(r => r.Product)
            .Include(r => r.ReceivedByUser)
            .Include(r => r.QualityInspection)
            .AsNoTracking();

        if (customerReturnId.HasValue)
            query = query.Where(r => r.CustomerReturnId == customerReturnId.Value);

        var list = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return list.Select(MapToReceiptDto);
    }

    #endregion

    #region Quality Disposition

    public async Task<ReturnDispositionDto> CreateDispositionAsync(CreateReturnDispositionDto dto, Guid? currentUserId)
    {
        var receipt = await _context.ReturnReceipts
            .Include(r => r.CustomerReturn)
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.Id == dto.ReturnReceiptId);

        if (receipt == null)
            throw new InvalidOperationException($"ReturnReceipt {dto.ReturnReceiptId} not found.");

        if (dto.Quantity <= 0)
            throw new ArgumentException("Disposition quantity must be greater than zero.");

        decimal existingDispositionedQty = await _context.ReturnDispositions
            .Where(d => d.ReturnReceiptId == dto.ReturnReceiptId && d.Status != ReturnDispositionStatus.Rejected)
            .SumAsync(d => (decimal?)d.Quantity) ?? 0m;

        if (existingDispositionedQty + dto.Quantity > receipt.Quantity)
        {
            throw new InvalidOperationException($"Requested disposition quantity ({dto.Quantity}) + previously dispositioned ({existingDispositionedQty}) exceeds received quantity ({receipt.Quantity}).");
        }

        string dispNumber = $"RDP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}";

        var disposition = new ReturnDisposition
        {
            DispositionNumber = dispNumber,
            CustomerReturnId = dto.CustomerReturnId,
            ReturnReceiptId = dto.ReturnReceiptId,
            ProductId = dto.ProductId,
            Quantity = dto.Quantity,
            DispositionType = dto.DispositionType,
            Status = ReturnDispositionStatus.Pending,
            Reason = dto.Reason,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _context.ReturnDispositions.Add(disposition);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("CreateDisposition", "ReturnDisposition", disposition.Id.ToString(), newValues: $"Created disposition {dispNumber} ({dto.DispositionType}) for Receipt {receipt.ReceiptNumber}");

        return (await GetDispositionByIdAsync(disposition.Id))!;
    }

    public async Task<ReturnDispositionDto> ApproveDispositionAsync(Guid id, Guid? currentUserId)
    {
        var disposition = await _context.ReturnDispositions
            .Include(d => d.CustomerReturn)
            .Include(d => d.ReturnReceipt)
            .Include(d => d.Product)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (disposition == null)
            throw new InvalidOperationException($"ReturnDisposition {id} not found.");

        if (disposition.Status == ReturnDispositionStatus.Executed)
            throw new InvalidOperationException($"Disposition {disposition.DispositionNumber} has already been executed.");

        disposition.Status = ReturnDispositionStatus.Approved;
        disposition.ApprovedByUserId = currentUserId;
        disposition.ApprovedDate = DateTime.UtcNow;

        // Execute specific disposition business logic
        switch (disposition.DispositionType)
        {
            case ReturnDispositionType.Restock:
                // Restock keeps/makes item in available stock
                disposition.Status = ReturnDispositionStatus.Executed;
                disposition.ExecutedDate = DateTime.UtcNow;
                break;

            case ReturnDispositionType.Scrap:
                // Scrapped item removes stock via InventoryMovementService adjustment
                if (disposition.ReturnReceipt != null)
                {
                    await _inventoryMovement.AdjustAsync(
                        disposition.ProductId,
                        disposition.ReturnReceipt.WarehouseId,
                        disposition.ReturnReceipt.WarehouseLocationId,
                        -disposition.Quantity,
                        $"Scrap Disposal from Return {disposition.DispositionNumber}",
                        currentUserId
                    );
                }
                disposition.Status = ReturnDispositionStatus.Executed;
                disposition.ExecutedDate = DateTime.UtcNow;
                break;

            case ReturnDispositionType.Repair:
                // Auto-create CustomerRepairRequest
                var repair = new CustomerRepairRequest
                {
                    RepairNumber = $"REP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}",
                    CustomerReturnId = disposition.CustomerReturnId,
                    ReturnAuthorizationId = disposition.ReturnReceipt?.ReturnAuthorizationId,
                    ProductId = disposition.ProductId,
                    SerialNumber = disposition.ReturnReceipt?.SerialNumber,
                    FaultDescription = $"Disposition Repair: {disposition.Reason}",
                    Status = ReturnRepairStatus.Requested,
                    CreatedAt = DateTime.UtcNow
                };
                _context.CustomerRepairRequests.Add(repair);
                disposition.Status = ReturnDispositionStatus.Executed;
                disposition.ExecutedDate = DateTime.UtcNow;
                break;

            case ReturnDispositionType.Replacement:
                // Auto-create ReplacementOrder
                if (disposition.ReturnReceipt != null)
                {
                    var replacement = new ReplacementOrder
                    {
                        ReplacementNumber = $"RPL-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}",
                        CustomerReturnId = disposition.CustomerReturnId,
                        ProductId = disposition.ProductId,
                        Quantity = disposition.Quantity,
                        WarehouseId = disposition.ReturnReceipt.WarehouseId,
                        Status = ReplacementStatus.Pending,
                        Notes = $"Disposition Replacement: {disposition.Reason}",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.ReplacementOrders.Add(replacement);
                }
                disposition.Status = ReturnDispositionStatus.Executed;
                disposition.ExecutedDate = DateTime.UtcNow;
                break;

            case ReturnDispositionType.Hold:
            case ReturnDispositionType.RejectReturn:
                disposition.Status = ReturnDispositionStatus.Executed;
                disposition.ExecutedDate = DateTime.UtcNow;
                break;
        }

        if (disposition.CustomerReturn != null)
        {
            disposition.CustomerReturn.Status = CustomerReturnStatus.Dispositioned;
            disposition.CustomerReturn.UpdatedAt = DateTime.UtcNow;
            _context.CustomerReturns.Update(disposition.CustomerReturn);
        }

        _context.ReturnDispositions.Update(disposition);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("ApproveDisposition", "ReturnDisposition", id.ToString(), newValues: $"Approved and executed disposition {disposition.DispositionNumber}");

        return (await GetDispositionByIdAsync(id))!;
    }

    public async Task<ReturnDispositionDto?> GetDispositionByIdAsync(Guid id)
    {
        var disposition = await _context.ReturnDispositions
            .Include(d => d.CustomerReturn)
            .Include(d => d.ReturnReceipt)
            .Include(d => d.Product)
            .Include(d => d.ApprovedByUser)
            .FirstOrDefaultAsync(d => d.Id == id);

        return disposition == null ? null : MapToDispositionDto(disposition);
    }

    public async Task<IEnumerable<ReturnDispositionDto>> GetAllDispositionsAsync(Guid? customerReturnId = null)
    {
        var query = _context.ReturnDispositions
            .Include(d => d.CustomerReturn)
            .Include(d => d.ReturnReceipt)
            .Include(d => d.Product)
            .Include(d => d.ApprovedByUser)
            .AsNoTracking();

        if (customerReturnId.HasValue)
            query = query.Where(d => d.CustomerReturnId == customerReturnId.Value);

        var list = await query.OrderByDescending(d => d.CreatedAt).ToListAsync();
        return list.Select(MapToDispositionDto);
    }

    #endregion

    #region Repairs

    public async Task<CustomerRepairRequestDto> CreateRepairAsync(CreateRepairRequestDto dto, Guid? currentUserId)
    {
        var customerReturn = await _context.CustomerReturns.FirstOrDefaultAsync(r => r.Id == dto.CustomerReturnId);
        if (customerReturn == null)
            throw new InvalidOperationException($"CustomerReturn {dto.CustomerReturnId} not found.");

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == dto.ProductId);
        if (product == null)
            throw new InvalidOperationException($"Product {dto.ProductId} not found.");

        string repairNumber = $"REP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}";

        var repair = new CustomerRepairRequest
        {
            RepairNumber = repairNumber,
            CustomerReturnId = dto.CustomerReturnId,
            ReturnAuthorizationId = dto.ReturnAuthorizationId,
            ProductId = dto.ProductId,
            SerialNumber = dto.SerialNumber?.Trim(),
            AssignedEmployeeId = dto.AssignedEmployeeId,
            WorkCenterId = dto.WorkCenterId,
            FaultDescription = dto.FaultDescription,
            Status = ReturnRepairStatus.Requested,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _context.CustomerRepairRequests.Add(repair);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("CreateRepair", "CustomerRepairRequest", repair.Id.ToString(), newValues: $"Created repair {repairNumber} for Product {product.Name}");

        return (await GetRepairByIdAsync(repair.Id))!;
    }

    public async Task<CustomerRepairRequestDto> ApproveRepairAsync(Guid id, Guid? currentUserId)
    {
        var repair = await _context.CustomerRepairRequests.FirstOrDefaultAsync(r => r.Id == id);
        if (repair == null)
            throw new InvalidOperationException($"CustomerRepairRequest {id} not found.");

        repair.Status = ReturnRepairStatus.Approved;
        repair.UpdatedAt = DateTime.UtcNow;
        repair.UpdatedBy = currentUserId;

        _context.CustomerRepairRequests.Update(repair);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("ApproveRepair", "CustomerRepairRequest", id.ToString(), newValues: $"Approved repair {repair.RepairNumber}");

        return (await GetRepairByIdAsync(id))!;
    }

    public async Task<CustomerRepairRequestDto> StartRepairAsync(Guid id, Guid? currentUserId)
    {
        var repair = await _context.CustomerRepairRequests.FirstOrDefaultAsync(r => r.Id == id);
        if (repair == null)
            throw new InvalidOperationException($"CustomerRepairRequest {id} not found.");

        repair.Status = ReturnRepairStatus.InRepair;
        repair.StartDate = DateTime.UtcNow;
        repair.UpdatedAt = DateTime.UtcNow;
        repair.UpdatedBy = currentUserId;

        _context.CustomerRepairRequests.Update(repair);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("StartRepair", "CustomerRepairRequest", id.ToString(), newValues: $"Started repair {repair.RepairNumber}");

        return (await GetRepairByIdAsync(id))!;
    }

    public async Task<CustomerRepairRequestDto> CompleteRepairAsync(Guid id, string repairAction, bool reinspectionPassed, Guid? currentUserId)
    {
        var repair = await _context.CustomerRepairRequests.FirstOrDefaultAsync(r => r.Id == id);
        if (repair == null)
            throw new InvalidOperationException($"CustomerRepairRequest {id} not found.");

        if (repair.Status != ReturnRepairStatus.InRepair && repair.Status != ReturnRepairStatus.Approved)
            throw new InvalidOperationException($"Repair {repair.RepairNumber} must be Approved or InRepair to complete.");

        // Create Quality Reinspection Record
        var reinspection = new QualityInspection
        {
            InspectionNumber = $"INS-REP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}",
            ProductId = repair.ProductId,
            InspectedQuantity = 1,
            PassedQuantity = reinspectionPassed ? 1 : 0,
            FailedQuantity = reinspectionPassed ? 0 : 1,
            Status = reinspectionPassed ? QualityInspectionStatus.Passed : QualityInspectionStatus.Failed,
            Remarks = $"Reinspection for Repair {repair.RepairNumber}. Serial: {repair.SerialNumber}, Action: {repairAction}",
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow
        };
        _context.QualityInspections.Add(reinspection);
        await _context.SaveChangesAsync();

        repair.RepairAction = repairAction;
        repair.Status = reinspectionPassed ? ReturnRepairStatus.Repaired : ReturnRepairStatus.Failed;
        repair.CompletionDate = DateTime.UtcNow;
        repair.ReinspectionId = reinspection.Id;
        repair.UpdatedAt = DateTime.UtcNow;
        repair.UpdatedBy = currentUserId;

        // If serial number exists and repaired, restore serial status to Available
        if (reinspectionPassed && !string.IsNullOrWhiteSpace(repair.SerialNumber))
        {
            var serial = await _context.InventorySerialNumbers.FirstOrDefaultAsync(s => s.SerialNumber == repair.SerialNumber.Trim());
            if (serial != null)
            {
                serial.Status = SerialStatus.Available;
                serial.UpdatedAt = DateTime.UtcNow;
                _context.InventorySerialNumbers.Update(serial);
            }
        }

        _context.CustomerRepairRequests.Update(repair);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("CompleteRepair", "CustomerRepairRequest", id.ToString(), newValues: $"Completed repair {repair.RepairNumber}. Reinspection: {(reinspectionPassed ? "PASSED" : "FAILED")}");

        return (await GetRepairByIdAsync(id))!;
    }

    public async Task<CustomerRepairRequestDto?> GetRepairByIdAsync(Guid id)
    {
        var repair = await _context.CustomerRepairRequests
            .Include(r => r.CustomerReturn)
            .Include(r => r.ReturnAuthorization)
            .Include(r => r.Product)
            .Include(r => r.AssignedEmployee).ThenInclude(e => e!.User)
            .Include(r => r.WorkCenter)
            .Include(r => r.Reinspection)
            .FirstOrDefaultAsync(r => r.Id == id);

        return repair == null ? null : MapToRepairDto(repair);
    }

    public async Task<IEnumerable<CustomerRepairRequestDto>> GetAllRepairsAsync(Guid? customerReturnId = null)
    {
        var query = _context.CustomerRepairRequests
            .Include(r => r.CustomerReturn)
            .Include(r => r.ReturnAuthorization)
            .Include(r => r.Product)
            .Include(r => r.AssignedEmployee).ThenInclude(e => e!.User)
            .Include(r => r.WorkCenter)
            .Include(r => r.Reinspection)
            .AsNoTracking();

        if (customerReturnId.HasValue)
            query = query.Where(r => r.CustomerReturnId == customerReturnId.Value);

        var list = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return list.Select(MapToRepairDto);
    }

    #endregion

    #region Replacements

    public async Task<ReplacementOrderDto> CreateReplacementAsync(CreateReplacementOrderDto dto, Guid? currentUserId)
    {
        var customerReturn = await _context.CustomerReturns.FirstOrDefaultAsync(r => r.Id == dto.CustomerReturnId);
        if (customerReturn == null)
            throw new InvalidOperationException($"CustomerReturn {dto.CustomerReturnId} not found.");

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == dto.ProductId);
        if (product == null)
            throw new InvalidOperationException($"Product {dto.ProductId} not found.");

        var warehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == dto.WarehouseId);
        if (warehouse == null)
            throw new InvalidOperationException($"Warehouse {dto.WarehouseId} not found.");

        if (dto.Quantity <= 0)
            throw new ArgumentException("Replacement quantity must be greater than zero.");

        // Reserve replacement stock via InventoryMovementService
        var invDto = await _inventoryMovement.ReserveAsync(
            dto.ProductId,
            dto.WarehouseId,
            null,
            dto.Quantity,
            InventoryReferenceType.SalesOrder,
            customerReturn.SalesOrderId,
            $"Reserve stock for Replacement Order (Return {customerReturn.ReturnNumber})",
            currentUserId
        );

        string rplNumber = $"RPL-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}";

        var replacement = new ReplacementOrder
        {
            ReplacementNumber = rplNumber,
            CustomerReturnId = dto.CustomerReturnId,
            ProductId = dto.ProductId,
            Quantity = dto.Quantity,
            WarehouseId = dto.WarehouseId,
            Status = ReplacementStatus.Reserved,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _context.ReplacementOrders.Add(replacement);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("CreateReplacement", "ReplacementOrder", replacement.Id.ToString(), newValues: $"Created replacement order {rplNumber} and reserved stock");

        return (await GetReplacementByIdAsync(replacement.Id))!;
    }

    public async Task<ReplacementOrderDto> ShipReplacementAsync(Guid id, string courierName, string trackingNumber, Guid? currentUserId)
    {
        var replacement = await _context.ReplacementOrders
            .Include(r => r.CustomerReturn)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (replacement == null)
            throw new InvalidOperationException($"ReplacementOrder {id} not found.");

        if (replacement.Status == ReplacementStatus.Shipped || replacement.Status == ReplacementStatus.Delivered)
            throw new InvalidOperationException($"ReplacementOrder {replacement.ReplacementNumber} is already shipped/delivered.");

        // Create actual Shipment using existing Shipment entity
        var shipment = new Shipment
        {
            SalesOrderId = replacement.CustomerReturn?.SalesOrderId ?? Guid.Empty,
            TrackingNumber = string.IsNullOrWhiteSpace(trackingNumber) ? $"RPL-TRK-{Guid.NewGuid().ToString("N")[..6].ToUpper()}" : trackingNumber.Trim(),
            CourierName = string.IsNullOrWhiteSpace(courierName) ? "Standard Express" : courierName.Trim(),
            DispatchDate = DateTime.UtcNow,
            Status = ShipmentStatus.Dispatched,
            CreatedAt = DateTime.UtcNow,
            ShipmentItems = new List<ShipmentItem>
            {
                new ShipmentItem
                {
                    ProductId = replacement.ProductId,
                    Quantity = replacement.Quantity,
                    DeliveredQuantity = 0,
                    CreatedAt = DateTime.UtcNow
                }
            }
        };

        _context.Shipments.Add(shipment);
        await _context.SaveChangesAsync();

        // Issue inventory via InventoryMovementService
        await _inventoryMovement.IssueAsync(
            replacement.ProductId,
            replacement.WarehouseId,
            null,
            replacement.Quantity,
            InventoryReferenceType.SalesOrder,
            replacement.CustomerReturn?.SalesOrderId,
            $"Issue replacement stock for Order {replacement.ReplacementNumber}",
            currentUserId
        );

        replacement.ShipmentId = shipment.Id;
        replacement.Status = ReplacementStatus.Shipped;
        replacement.UpdatedAt = DateTime.UtcNow;
        replacement.UpdatedBy = currentUserId;

        _context.ReplacementOrders.Update(replacement);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("ShipReplacement", "ReplacementOrder", id.ToString(), newValues: $"Dispatched replacement shipment {shipment.TrackingNumber}");

        return (await GetReplacementByIdAsync(id))!;
    }

    public async Task<ReplacementOrderDto?> GetReplacementByIdAsync(Guid id)
    {
        var replacement = await _context.ReplacementOrders
            .Include(r => r.CustomerReturn)
            .Include(r => r.Product)
            .Include(r => r.Warehouse)
            .Include(r => r.Shipment)
            .FirstOrDefaultAsync(r => r.Id == id);

        return replacement == null ? null : MapToReplacementDto(replacement);
    }

    public async Task<IEnumerable<ReplacementOrderDto>> GetAllReplacementsAsync(Guid? customerReturnId = null)
    {
        var query = _context.ReplacementOrders
            .Include(r => r.CustomerReturn)
            .Include(r => r.Product)
            .Include(r => r.Warehouse)
            .Include(r => r.Shipment)
            .AsNoTracking();

        if (customerReturnId.HasValue)
            query = query.Where(r => r.CustomerReturnId == customerReturnId.Value);

        var list = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return list.Select(MapToReplacementDto);
    }

    #endregion

    #region Reverse Logistics Summary

    public async Task<ReverseLogisticsSummaryDto> GetSummaryReportAsync()
    {
        var returns = await _context.CustomerReturns.AsNoTracking().ToListAsync();
        var rmas = await _context.ReturnAuthorizations.AsNoTracking().ToListAsync();
        var receipts = await _context.ReturnReceipts.AsNoTracking().ToListAsync();
        var dispositions = await _context.ReturnDispositions.AsNoTracking().ToListAsync();
        var repairs = await _context.CustomerRepairRequests.AsNoTracking().ToListAsync();
        var replacements = await _context.ReplacementOrders.AsNoTracking().ToListAsync();

        var summary = new ReverseLogisticsSummaryDto
        {
            TotalReturns = returns.Count,
            PendingRmas = rmas.Count(r => r.Status == RmaStatus.Submitted),
            ApprovedRmas = rmas.Count(r => r.Status == RmaStatus.Approved),
            TotalReceipts = receipts.Count,
            InRepairs = repairs.Count(r => r.Status == ReturnRepairStatus.InRepair || r.Status == ReturnRepairStatus.Approved),
            CompletedRepairs = repairs.Count(r => r.Status == ReturnRepairStatus.Repaired),
            ReplacementsIssued = replacements.Count(r => r.Status == ReplacementStatus.Shipped || r.Status == ReplacementStatus.Delivered),
            RestockedQuantity = dispositions.Where(d => d.DispositionType == ReturnDispositionType.Restock && d.Status == ReturnDispositionStatus.Executed).Sum(d => d.Quantity),
            ScrappedQuantity = dispositions.Where(d => d.DispositionType == ReturnDispositionType.Scrap && d.Status == ReturnDispositionStatus.Executed).Sum(d => d.Quantity),

            StatusBreakdown = returns.GroupBy(r => r.Status.ToString()).ToDictionary(g => g.Key, g => g.Count()),
            DispositionBreakdown = dispositions.GroupBy(d => d.DispositionType.ToString()).ToDictionary(g => g.Key, g => g.Count()),
            ReasonBreakdown = returns.GroupBy(r => string.IsNullOrWhiteSpace(r.Reason) ? "Unspecified" : r.Reason).ToDictionary(g => g.Key, g => g.Count())
        };

        return summary;
    }

    #endregion

    #region Mapping Helpers

    private static CustomerReturnDto MapToReturnDto(CustomerReturn entity) => new()
    {
        Id = entity.Id,
        ReturnNumber = entity.ReturnNumber,
        CustomerId = entity.CustomerId,
        CustomerName = entity.Customer?.CompanyName ?? string.Empty,
        SalesOrderId = entity.SalesOrderId,
        SalesOrderNumber = entity.SalesOrder?.OrderNumber ?? string.Empty,
        ShipmentId = entity.ShipmentId,
        ShipmentTrackingNumber = entity.Shipment?.TrackingNumber,
        WarrantyClaimId = entity.WarrantyClaimId,
        Reason = entity.Reason,
        RequestedDate = entity.RequestedDate,
        Status = entity.Status,
        Notes = entity.Notes,
        CreatedByUserId = entity.CreatedByUserId,
        CreatedByName = entity.CreatedByUser != null ? $"{entity.CreatedByUser.FirstName} {entity.CreatedByUser.LastName}".Trim() : null,
        CreatedAt = entity.CreatedAt,
        Items = entity.Items.Select(i => new CustomerReturnItemDto
        {
            Id = i.Id,
            CustomerReturnId = i.CustomerReturnId,
            ProductId = i.ProductId,
            ProductCode = i.Product?.ProductCode ?? string.Empty,
            ProductName = i.Product?.Name ?? string.Empty,
            Quantity = i.Quantity,
            SerialNumber = i.SerialNumber,
            BatchNumber = i.BatchNumber,
            Reason = i.Reason,
            Condition = i.Condition
        }).ToList(),
        RMA = entity.RMA == null ? null : MapToRmaDto(entity.RMA),
        Receipts = entity.Receipts.Select(MapToReceiptDto).ToList(),
        Dispositions = entity.Dispositions.Select(MapToDispositionDto).ToList(),
        Repairs = entity.Repairs.Select(MapToRepairDto).ToList(),
        Replacements = entity.Replacements.Select(MapToReplacementDto).ToList()
    };

    private static ReturnAuthorizationDto MapToRmaDto(ReturnAuthorization entity) => new()
    {
        Id = entity.Id,
        RmaNumber = entity.RmaNumber,
        CustomerReturnId = entity.CustomerReturnId,
        ReturnNumber = entity.CustomerReturn?.ReturnNumber ?? string.Empty,
        AuthorizedByUserId = entity.AuthorizedByUserId,
        AuthorizedByName = entity.AuthorizedByUser != null ? $"{entity.AuthorizedByUser.FirstName} {entity.AuthorizedByUser.LastName}".Trim() : null,
        AuthorizationDate = entity.AuthorizationDate,
        Status = entity.Status,
        Reason = entity.Reason,
        Instructions = entity.Instructions
    };

    private static ReturnReceiptDto MapToReceiptDto(ReturnReceipt entity) => new()
    {
        Id = entity.Id,
        ReceiptNumber = entity.ReceiptNumber,
        CustomerReturnId = entity.CustomerReturnId,
        ReturnNumber = entity.CustomerReturn?.ReturnNumber ?? string.Empty,
        ReturnAuthorizationId = entity.ReturnAuthorizationId,
        RmaNumber = entity.ReturnAuthorization?.RmaNumber,
        WarehouseId = entity.WarehouseId,
        WarehouseName = entity.Warehouse?.WarehouseName ?? string.Empty,
        WarehouseLocationId = entity.WarehouseLocationId,
        LocationName = entity.WarehouseLocation?.LocationName,
        ProductId = entity.ProductId,
        ProductCode = entity.Product?.ProductCode ?? string.Empty,
        ProductName = entity.Product?.Name ?? string.Empty,
        ReceivedByUserId = entity.ReceivedByUserId,
        ReceivedByName = entity.ReceivedByUser != null ? $"{entity.ReceivedByUser.FirstName} {entity.ReceivedByUser.LastName}".Trim() : null,
        ReceivedDate = entity.ReceivedDate,
        Quantity = entity.Quantity,
        SerialNumber = entity.SerialNumber,
        BatchNumber = entity.BatchNumber,
        Condition = entity.Condition,
        Notes = entity.Notes,
        QualityInspectionId = entity.QualityInspectionId,
        InspectionStatus = entity.QualityInspection?.Status.ToString()
    };

    private static ReturnDispositionDto MapToDispositionDto(ReturnDisposition entity) => new()
    {
        Id = entity.Id,
        DispositionNumber = entity.DispositionNumber,
        CustomerReturnId = entity.CustomerReturnId,
        ReturnNumber = entity.CustomerReturn?.ReturnNumber ?? string.Empty,
        ReturnReceiptId = entity.ReturnReceiptId,
        ReceiptNumber = entity.ReturnReceipt?.ReceiptNumber ?? string.Empty,
        ProductId = entity.ProductId,
        ProductCode = entity.Product?.ProductCode ?? string.Empty,
        ProductName = entity.Product?.Name ?? string.Empty,
        Quantity = entity.Quantity,
        DispositionType = entity.DispositionType,
        Status = entity.Status,
        Reason = entity.Reason,
        ApprovedByUserId = entity.ApprovedByUserId,
        ApprovedByName = entity.ApprovedByUser != null ? $"{entity.ApprovedByUser.FirstName} {entity.ApprovedByUser.LastName}".Trim() : null,
        ApprovedDate = entity.ApprovedDate,
        ExecutedDate = entity.ExecutedDate,
        Notes = entity.Notes
    };

    private static CustomerRepairRequestDto MapToRepairDto(CustomerRepairRequest entity) => new()
    {
        Id = entity.Id,
        RepairNumber = entity.RepairNumber,
        CustomerReturnId = entity.CustomerReturnId,
        ReturnNumber = entity.CustomerReturn?.ReturnNumber ?? string.Empty,
        ReturnAuthorizationId = entity.ReturnAuthorizationId,
        RmaNumber = entity.ReturnAuthorization?.RmaNumber,
        ProductId = entity.ProductId,
        ProductCode = entity.Product?.ProductCode ?? string.Empty,
        ProductName = entity.Product?.Name ?? string.Empty,
        SerialNumber = entity.SerialNumber,
        AssignedEmployeeId = entity.AssignedEmployeeId,
        AssignedEmployeeName = entity.AssignedEmployee?.User != null ? $"{entity.AssignedEmployee.User.FirstName} {entity.AssignedEmployee.User.LastName}".Trim() : null,
        WorkCenterId = entity.WorkCenterId,
        WorkCenterName = entity.WorkCenter?.Name,
        FaultDescription = entity.FaultDescription,
        RepairAction = entity.RepairAction,
        Status = entity.Status,
        StartDate = entity.StartDate,
        CompletionDate = entity.CompletionDate,
        ReinspectionId = entity.ReinspectionId,
        ReinspectionStatus = entity.Reinspection?.Status.ToString(),
        Notes = entity.Notes
    };

    private static ReplacementOrderDto MapToReplacementDto(ReplacementOrder entity) => new()
    {
        Id = entity.Id,
        ReplacementNumber = entity.ReplacementNumber,
        CustomerReturnId = entity.CustomerReturnId,
        ReturnNumber = entity.CustomerReturn?.ReturnNumber ?? string.Empty,
        ProductId = entity.ProductId,
        ProductCode = entity.Product?.ProductCode ?? string.Empty,
        ProductName = entity.Product?.Name ?? string.Empty,
        Quantity = entity.Quantity,
        WarehouseId = entity.WarehouseId,
        WarehouseName = entity.Warehouse?.WarehouseName ?? string.Empty,
        Status = entity.Status,
        ReservationId = entity.ReservationId,
        ShipmentId = entity.ShipmentId,
        ShipmentTrackingNumber = entity.Shipment?.TrackingNumber,
        Notes = entity.Notes
    };

    #endregion
}
