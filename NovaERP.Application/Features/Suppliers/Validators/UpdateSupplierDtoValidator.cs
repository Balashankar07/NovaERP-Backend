using FluentValidation;
using NovaERP.Application.Features.Suppliers.DTOs;

namespace NovaERP.Application.Features.Suppliers.Validators;

public class UpdateSupplierDtoValidator : AbstractValidator<UpdateSupplierDto>
{
    public UpdateSupplierDtoValidator()
    {
        RuleFor(v => v.SupplierCode)
            .NotEmpty().WithMessage("Supplier Code is required.")
            .MaximumLength(50).WithMessage("Supplier Code must not exceed 50 characters.");

        RuleFor(v => v.SupplierName)
            .NotEmpty().WithMessage("Supplier Name is required.")
            .MaximumLength(100).WithMessage("Supplier Name must not exceed 100 characters.");

        RuleFor(v => v.CompanyName)
            .MaximumLength(100).WithMessage("Company Name must not exceed 100 characters.");

        RuleFor(v => v.ContactPerson)
            .MaximumLength(100).WithMessage("Contact Person must not exceed 100 characters.");

        RuleFor(v => v.Email)
            .EmailAddress().WithMessage("Invalid email format.")
            .MaximumLength(100).WithMessage("Email must not exceed 100 characters.")
            .When(v => !string.IsNullOrEmpty(v.Email));

        RuleFor(v => v.Phone)
            .MaximumLength(20).WithMessage("Phone must not exceed 20 characters.");

        RuleFor(v => v.Mobile)
            .MaximumLength(20).WithMessage("Mobile must not exceed 20 characters.");

        RuleFor(v => v.Website)
            .MaximumLength(200).WithMessage("Website must not exceed 200 characters.");

        RuleFor(v => v.AddressLine1)
            .MaximumLength(200).WithMessage("Address Line 1 must not exceed 200 characters.");

        RuleFor(v => v.AddressLine2)
            .MaximumLength(200).WithMessage("Address Line 2 must not exceed 200 characters.");

        RuleFor(v => v.City)
            .MaximumLength(100).WithMessage("City must not exceed 100 characters.");

        RuleFor(v => v.State)
            .MaximumLength(100).WithMessage("State must not exceed 100 characters.");

        RuleFor(v => v.Country)
            .MaximumLength(100).WithMessage("Country must not exceed 100 characters.");

        RuleFor(v => v.PostalCode)
            .MaximumLength(20).WithMessage("Postal Code must not exceed 20 characters.");

        RuleFor(v => v.TaxRegistrationNumber)
            .MaximumLength(50).WithMessage("Tax Registration Number must not exceed 50 characters.");

        RuleFor(v => v.PaymentTerms)
            .MaximumLength(50).WithMessage("Payment Terms must not exceed 50 characters.");

        RuleFor(v => v.Currency)
            .MaximumLength(10).WithMessage("Currency must not exceed 10 characters.");

        RuleFor(v => v.CreditLimit)
            .GreaterThanOrEqualTo(0).WithMessage("Credit Limit cannot be negative.")
            .When(v => v.CreditLimit.HasValue);
    }
}
