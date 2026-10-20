using FluentValidation;
using NovaERP.Application.Features.Users.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

namespace NovaERP.Application.Features.Users.Validators;

public class UpdateUserDtoValidator : AbstractValidator<UpdateUserDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateUserDtoValidator(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;

        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.CompanyId).NotEmpty();

        RuleFor(x => x.RoleIds)
            .MustAsync(RolesMustExistAndBeActive).When(x => x.RoleIds != null && x.RoleIds.Any())
            .WithMessage("One or more assigned roles are invalid or inactive.");
    }

    private async Task<bool> RolesMustExistAndBeActive(System.Collections.Generic.ICollection<System.Guid>? roleIds, CancellationToken cancellationToken)
    {
        if (roleIds == null || !roleIds.Any()) return true;

        foreach (var roleId in roleIds)
        {
            var role = await _unitOfWork.Roles.GetByIdAsync(roleId);
            if (role == null || !role.IsActive) return false;
        }
        return true;
    }
}
