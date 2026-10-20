using System.Threading.Tasks;
using NovaERP.Application.Features.Admin.DTOs;

namespace NovaERP.Application.Interfaces.Services;

public interface IAdminService
{
    Task<AdminOverviewDto> GetOverviewAsync();
    Task<AdminSecurityDto> GetSecurityOverviewAsync();
    Task<List<AdminModuleStatusDto>> GetModuleStatusesAsync();
    Task<List<AdminHealthStatusDto>> GetSystemHealthAsync();
    Task<AdminSystemConfigDto> GetSystemConfigurationAsync();
    Task<AdminSystemInfoDto> GetSystemInfoAsync();
    Task<RolePermissionMatrixDto> GetPermissionMatrixAsync();
    Task ToggleRolePermissionAsync(ToggleRolePermissionDto dto);
}
