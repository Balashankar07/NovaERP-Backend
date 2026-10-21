using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Services;

public class AuditLogger : IAuditLogger
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public AuditLogger(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task LogAsync(string action, string entityName, string entityId, string oldValues = "", string newValues = "")
    {
        var auditLog = new AuditLog
        {
            UserId = _currentUserService.IsAuthenticated ? _currentUserService.UserId : null,
            Action = action ?? string.Empty,
            EntityName = entityName ?? string.Empty,
            EntityId = entityId ?? string.Empty,
            OldValues = oldValues ?? string.Empty,
            NewValues = newValues ?? string.Empty,
            IpAddress = string.Empty,
            Timestamp = DateTime.UtcNow
        };

        await _unitOfWork.AuditLogs.AddAsync(auditLog);
        await _unitOfWork.SaveChangesAsync();
    }
}
