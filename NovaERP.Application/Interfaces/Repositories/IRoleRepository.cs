using NovaERP.Domain.Entities;

namespace NovaERP.Application.Interfaces.Repositories
{
    public interface IRoleRepository : IRepository<Role>
    {
        Task<Role?> GetByNameAsync(string name);
        Task<NovaERP.Application.Common.Models.PagedResult<Role>> GetAllFilteredAsync(int pageNumber, int pageSize, string? search, string? sortBy, string? sortOrder, bool? isOperationallyReady);
    }
}