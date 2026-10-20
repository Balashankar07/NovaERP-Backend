using FluentValidation;
using NovaERP.Application.DTOs.Procurement;

namespace NovaERP.Application.Features.PurchaseRequests.Validators;

public class UpdatePurchaseRequestDtoValidator : AbstractValidator<UpdatePurchaseRequestDto>
{
    public UpdatePurchaseRequestDtoValidator()
    {
        RuleFor(x => x.RequiredByDate)
            .GreaterThanOrEqualTo(System.DateTime.UtcNow.Date)
            .WithMessage("Required By Date cannot be in the past.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Purchase Request must contain at least one item.");

        RuleForEach(x => x.Items).ChildRules(items =>
        {
            items.RuleFor(i => i.ProductId).NotEmpty().WithMessage("Product ID is required.");
            items.RuleFor(i => i.RequestedQuantity).GreaterThan(0).WithMessage("Requested quantity must be greater than 0.");
        });
    }
}
