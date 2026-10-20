using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class CustomerRepairRequest : AuditableEntity
{
    public string RepairNumber { get; set; } = string.Empty;

    public Guid CustomerReturnId { get; set; }
    public CustomerReturn? CustomerReturn { get; set; }

    public Guid? ReturnAuthorizationId { get; set; }
    public ReturnAuthorization? ReturnAuthorization { get; set; }

    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public string? SerialNumber { get; set; }

    public Guid? AssignedEmployeeId { get; set; }
    public EmployeeProfile? AssignedEmployee { get; set; }

    public Guid? WorkCenterId { get; set; }
    public WorkCenter? WorkCenter { get; set; }

    public string FaultDescription { get; set; } = string.Empty;
    public string? RepairAction { get; set; }
    public ReturnRepairStatus Status { get; set; } = ReturnRepairStatus.Requested;

    public DateTime? StartDate { get; set; }
    public DateTime? CompletionDate { get; set; }

    public Guid? ReinspectionId { get; set; }
    public QualityInspection? Reinspection { get; set; }

    public string? Notes { get; set; }
}
