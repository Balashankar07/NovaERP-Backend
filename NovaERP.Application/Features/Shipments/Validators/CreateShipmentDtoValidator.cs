using FluentValidation;
using NovaERP.Application.Features.Shipments.DTOs;

namespace NovaERP.Application.Features.Shipments.Validators;

public class CreateShipmentDtoValidator : AbstractValidator<CreateShipmentDto>
{
    public CreateShipmentDtoValidator()
    {
        RuleFor(x => x.SalesOrderId)
            .NotEmpty().WithMessage("Sales Order ID is required.");

        RuleFor(x => x.TrackingNumber)
            .NotEmpty().WithMessage("Tracking Number is required.")
            .MaximumLength(100).WithMessage("Tracking Number must not exceed 100 characters.");

        RuleFor(x => x.CourierName)
            .NotEmpty().WithMessage("Courier Name is required.")
            .MaximumLength(100).WithMessage("Courier Name must not exceed 100 characters.");

        RuleFor(x => x.ShipmentItems)
            .NotEmpty().WithMessage("At least one shipment item is required.");

        RuleForEach(x => x.ShipmentItems).SetValidator(new CreateShipmentItemDtoValidator());
    }
}

public class CreateShipmentItemDtoValidator : AbstractValidator<CreateShipmentItemDto>
{
    public CreateShipmentItemDtoValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product ID is required.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero.");
    }
}
