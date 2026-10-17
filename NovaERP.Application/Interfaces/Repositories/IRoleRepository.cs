using NovaERP.Domain.Entities;

namespace NovaERP.Application.Interfaces.Repositories
{
    public interface IRoleRepository : IRepository<Role>
    {
        Task<Role?> GetByNameAsync(string name);
    }
}