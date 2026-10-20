using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;

namespace NovaERP.Domain.Entities;

public class SupplierScorecardConfig : AuditableEntity
{
    [Column(TypeName = "decimal(5,2)")]
    public decimal DeliveryWeight { get; set; } = 30.00m;

    [Column(TypeName = "decimal(5,2)")]
    public decimal FulfillmentWeight { get; set; } = 25.00m;

    [Column(TypeName = "decimal(5,2)")]
    public decimal QualityWeight { get; set; } = 30.00m;

    [Column(TypeName = "decimal(5,2)")]
    public decimal CommercialWeight { get; set; } = 15.00m;

    [Column(TypeName = "decimal(5,2)")]
    public decimal GradeAThreshold { get; set; } = 90.00m;

    [Column(TypeName = "decimal(5,2)")]
    public decimal GradeBThreshold { get; set; } = 75.00m;

    [Column(TypeName = "decimal(5,2)")]
    public decimal GradeCThreshold { get; set; } = 60.00m;

    public string Notes { get; set; } = "Default Deterministic Scorecard Weights";
}
