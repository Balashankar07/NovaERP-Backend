using FluentValidation;
using NovaERP.Application.Features.Roles.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

namespace NovaERP.Application.Features.Roles.Validators;

public class UpdateRoleDtoValidator : AbstractValidator<UpdateRoleDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateRoleDtoValidator(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;

        RuleFor(x => x.Name)
            .NotEmpty().MaximumLength(100);

        RuleFor(x => x.Description).MaximumLength(500);

        RuleFor(x => x.PermissionIds)
            .MustAsync(PermissionsMustExist).When(x => x.PermissionIds != null && x.PermissionIds.Any())
            .WithMessage("One or more permissions are invalid.");
    }

    private async Task<bool> PermissionsMustExist(System.Collections.Generic.List<System.Guid>? permissionIds, CancellationToken cancellationToken)
    {
        if (permissionIds == null || !permissionIds.Any()) return true;

        foreach (var permissionId in permissionIds)
        {
            var permission = await _unitOfWork.Permissions.GetByIdAsync(permissionId);
            if (permission == null) return false;
        }
        return true;
    }
}
