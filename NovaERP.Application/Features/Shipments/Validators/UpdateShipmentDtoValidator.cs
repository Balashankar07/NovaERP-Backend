using FluentValidation;
using NovaERP.Application.Features.Shipments.DTOs;

namespace NovaERP.Application.Features.Shipments.Validators;

public class UpdateShipmentDtoValidator : AbstractValidator<UpdateShipmentDto>
{
    public UpdateShipmentDtoValidator()
    {
        RuleFor(x => x.TrackingNumber)
            .MaximumLength(100).WithMessage("Tracking Number must not exceed 100 characters.");

        RuleFor(x => x.CourierName)
            .MaximumLength(100).WithMessage("Courier Name must not exceed 100 characters.");
    }
}
