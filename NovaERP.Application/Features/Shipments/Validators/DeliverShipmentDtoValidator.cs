using FluentValidation;
using NovaERP.Application.Features.Shipments.DTOs;

namespace NovaERP.Application.Features.Shipments.Validators;

public class DeliverShipmentDtoValidator : AbstractValidator<DeliverShipmentDto>
{
    public DeliverShipmentDtoValidator()
    {
        RuleFor(x => x.DeliveredItems)
            .NotEmpty().WithMessage("At least one delivered item is required.");

        RuleForEach(x => x.DeliveredItems).SetValidator(new DeliverShipmentItemDtoValidator());
    }
}

public class DeliverShipmentItemDtoValidator : AbstractValidator<DeliverShipmentItemDto>
{
    public DeliverShipmentItemDtoValidator()
    {
        RuleFor(x => x.ShipmentItemId)
            .NotEmpty().WithMessage("Shipment Item ID is required.");

        RuleFor(x => x.DeliveredQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Delivered quantity cannot be negative.");
    }
}
