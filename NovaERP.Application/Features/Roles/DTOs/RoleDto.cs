namespace NovaERP.Application.Features.Roles.DTOs;

public class RoleDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public bool IsActive { get; set; }
    
    // Readiness Metadata
    public bool IsOperationallyReady { get; set; }
    public string ReadinessReason { get; set; } = string.Empty;
    public string DashboardRoute { get; set; } = string.Empty;
}