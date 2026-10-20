using FluentValidation;
using NovaERP.Application.Features.Products.DTOs;

namespace NovaERP.Application.Features.Products.Validators;

public class ProductSpecificationDtoValidator : AbstractValidator<ProductSpecificationDto>
{
    public ProductSpecificationDtoValidator()
    {
        RuleFor(x => x.AttributeName)
            .NotEmpty().WithMessage("Attribute name is required.")
            .MaximumLength(100).WithMessage("Attribute name cannot exceed 100 characters.");

        RuleFor(x => x.Value)
            .NotEmpty().WithMessage("Value is required.")
            .MaximumLength(500).WithMessage("Value cannot exceed 500 characters.");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be 0 or greater.");
    }
}

public class CreateProductDtoValidator : AbstractValidator<CreateProductDto>
{
    public CreateProductDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ProductType).IsInEnum();
        RuleForEach(x => x.Specifications).SetValidator(new ProductSpecificationDtoValidator());
    }
}

public class UpdateProductDtoValidator : AbstractValidator<UpdateProductDto>
{
    public UpdateProductDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ProductType).IsInEnum();
        RuleForEach(x => x.Specifications).SetValidator(new ProductSpecificationDtoValidator());
    }
}
