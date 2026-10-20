using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class SupplierScorecardConfigConfiguration : IEntityTypeConfiguration<SupplierScorecardConfig>
{
    public void Configure(EntityTypeBuilder<SupplierScorecardConfig> builder)
    {
        builder.ToTable("SupplierScorecardConfigs");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.DeliveryWeight)
            .HasPrecision(5, 2)
            .IsRequired();

        builder.Property(c => c.FulfillmentWeight)
            .HasPrecision(5, 2)
            .IsRequired();

        builder.Property(c => c.QualityWeight)
            .HasPrecision(5, 2)
            .IsRequired();

        builder.Property(c => c.CommercialWeight)
            .HasPrecision(5, 2)
            .IsRequired();

        builder.Property(c => c.GradeAThreshold)
            .HasPrecision(5, 2)
            .IsRequired();

        builder.Property(c => c.GradeBThreshold)
            .HasPrecision(5, 2)
            .IsRequired();

        builder.Property(c => c.GradeCThreshold)
            .HasPrecision(5, 2)
            .IsRequired();
    }
}
