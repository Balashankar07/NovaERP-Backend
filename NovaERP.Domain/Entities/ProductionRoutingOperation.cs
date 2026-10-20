using NovaERP.Domain.Common;

namespace NovaERP.Domain.Entities;

public class ProductionRoutingOperation : AuditableEntity
{
    public Guid RoutingId { get; set; }
    public ProductionRouting Routing { get; set; } = null!;

    public int SequenceNumber { get; set; }
    public string OperationName { get; set; } = string.Empty;

    public Guid WorkCenterId { get; set; }
    public WorkCenter WorkCenter { get; set; } = null!;

    public Guid? MachineId { get; set; }
    public Machine? Machine { get; set; }

    public int StandardDurationMinutes { get; set; }
    public int SetupDurationMinutes { get; set; }
    public string? Description { get; set; }
}
