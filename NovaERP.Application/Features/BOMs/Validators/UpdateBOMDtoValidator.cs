using FluentValidation;
using NovaERP.Application.Features.BOMs.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace NovaERP.Application.Features.BOMs.Validators;

public class UpdateBOMDtoValidator : AbstractValidator<UpdateBOMDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateBOMDtoValidator(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;

        RuleFor(x => x.Version)
            .NotEmpty().WithMessage("Version is required.")
            .MaximumLength(50).WithMessage("Version cannot exceed 50 characters.");

        RuleFor(x => x.EffectiveDate)
            .NotEmpty().WithMessage("EffectiveDate is required.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("A BOM must contain at least one item.")
            .Must(HaveUniqueComponents).WithMessage("Duplicate components within the same BOM are not allowed.");

        RuleForEach(x => x.Items).SetValidator(new UpdateBOMItemDtoValidator(unitOfWork));
    }

    private bool HaveUniqueComponents(System.Collections.Generic.List<UpdateBOMItemDto> items)
    {
        if (items == null || !items.Any()) return true;
        var distinctCount = items.Select(x => x.RawMaterialProductId).Distinct().Count();
        return distinctCount == items.Count;
    }
}

public class UpdateBOMItemDtoValidator : AbstractValidator<UpdateBOMItemDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateBOMItemDtoValidator(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;

        RuleFor(x => x.RawMaterialProductId)
            .NotEmpty().WithMessage("Component Product ID is required.")
            .MustAsync(BeValidComponent).WithMessage("Component must exist, be active, and be of type Component.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than 0.");

        RuleFor(x => x.WastePercentage)
            .InclusiveBetween(0, 100).WithMessage("Waste Percentage must be between 0 and 100.");

        RuleFor(x => x.UnitId)
            .NotEmpty().WithMessage("Unit ID is required.")
            .MustAsync(BeValidUnit).WithMessage("Unit must exist and be active.");
    }

    private async Task<bool> BeValidComponent(Guid componentId, CancellationToken cancellationToken)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(componentId);
        if (product == null) return false;
        if (!product.IsActive) return false;
        if (product.Type != NovaERP.Domain.Enums.ProductType.Component) return false;
        return true;
    }

    private async Task<bool> BeValidUnit(Guid unitId, CancellationToken cancellationToken)
    {
        var unit = await _unitOfWork.Units.GetByIdAsync(unitId);
        if (unit == null) return false;
        return unit.IsActive;
    }
}
