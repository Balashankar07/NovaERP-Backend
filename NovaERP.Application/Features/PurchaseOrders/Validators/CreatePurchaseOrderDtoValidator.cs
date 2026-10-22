using FluentValidation;
using NovaERP.Application.Features.PurchaseOrders.DTOs;

namespace NovaERP.Application.Features.PurchaseOrders.Validators;

public class CreatePurchaseOrderDtoValidator : AbstractValidator<CreatePurchaseOrderDto>
{
    public CreatePurchaseOrderDtoValidator()
    {
        RuleFor(x => x.SupplierId).NotEmpty().WithMessage("Supplier is required.");
        
        RuleFor(x => x.ExpectedDeliveryDate)
            .GreaterThanOrEqualTo(System.DateTime.UtcNow.Date.AddDays(-1))
            .WithMessage("Expected Delivery Date cannot be in the past.");

        RuleFor(x => x.Currency).NotEmpty().MaximumLength(3);

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Purchase Order must contain at least one item.");

        RuleForEach(x => x.Items).ChildRules(items =>
        {
            items.RuleFor(i => i.ProductId).NotEmpty().WithMessage("Product ID is required.");
            items.RuleFor(i => i.Quantity).GreaterThan(0).WithMessage("Quantity must be greater than 0.");
            items.RuleFor(i => i.UnitPrice).GreaterThanOrEqualTo(0).WithMessage("UnitPrice cannot be negative.");
            items.RuleFor(i => i.Discount).GreaterThanOrEqualTo(0).WithMessage("Discount cannot be negative.");
            items.RuleFor(i => i.Tax).GreaterThanOrEqualTo(0).WithMessage("Tax cannot be negative.");
        });
    }
}
