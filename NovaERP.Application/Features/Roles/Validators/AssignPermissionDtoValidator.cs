using FluentValidation;
using NovaERP.Application.Features.Roles.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

namespace NovaERP.Application.Features.Roles.Validators;

public class AssignPermissionDtoValidator : AbstractValidator<AssignPermissionDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public AssignPermissionDtoValidator(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;

        RuleFor(x => x.RoleId).NotEmpty();

        RuleFor(x => x.PermissionIds)
            .NotEmpty().WithMessage("At least one permission ID is required.")
            .MustAsync(PermissionsMustExist).WithMessage("One or more permissions are invalid.");
    }

    private async Task<bool> PermissionsMustExist(System.Collections.Generic.List<System.Guid> permissionIds, CancellationToken cancellationToken)
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
