using FluentValidation;
using NovaERP.Application.Features.Users.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

namespace NovaERP.Application.Features.Users.Validators;

public class AssignRoleDtoValidator : AbstractValidator<AssignRoleDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public AssignRoleDtoValidator(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;

        RuleFor(x => x.UserId).NotEmpty();

        RuleFor(x => x.RoleIds)
            .NotEmpty().WithMessage("At least one role ID is required.")
            .MustAsync(RolesMustExistAndBeActive).WithMessage("One or more assigned roles are invalid or inactive.");
    }

    private async Task<bool> RolesMustExistAndBeActive(System.Collections.Generic.List<System.Guid> roleIds, CancellationToken cancellationToken)
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
