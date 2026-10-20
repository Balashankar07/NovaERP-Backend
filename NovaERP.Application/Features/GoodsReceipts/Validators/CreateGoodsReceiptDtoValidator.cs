using FluentValidation;
using NovaERP.Application.Features.GoodsReceipts.DTOs;

namespace NovaERP.Application.Features.GoodsReceipts.Validators;

public class CreateGoodsReceiptDtoValidator : AbstractValidator<CreateGoodsReceiptDto>
{
    public CreateGoodsReceiptDtoValidator()
    {
        RuleFor(x => x.PurchaseOrderId)
            .NotEmpty().WithMessage("Purchase Order ID is required.");

        RuleFor(x => x.WarehouseId)
            .NotEmpty().WithMessage("Warehouse ID is required.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("At least one item is required.")
            .Must(items => items != null && items.Select(i => i.PurchaseOrderItemId).Distinct().Count() == items.Count)
            .WithMessage("Duplicate purchase order items are not allowed in the same Goods Receipt.");

        RuleForEach(x => x.Items).SetValidator(new CreateGoodsReceiptItemDtoValidator());
    }
}

public class CreateGoodsReceiptItemDtoValidator : AbstractValidator<CreateGoodsReceiptItemDto>
{
    public CreateGoodsReceiptItemDtoValidator()
    {
        RuleFor(x => x.PurchaseOrderItemId)
            .NotEmpty().WithMessage("Purchase Order Item ID is required.");

        RuleFor(x => x.ReceivedQuantity)
            .GreaterThan(0).WithMessage("Received quantity must be greater than zero.");

        RuleFor(x => x.RejectedQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Rejected quantity cannot be negative.");
    }
}
