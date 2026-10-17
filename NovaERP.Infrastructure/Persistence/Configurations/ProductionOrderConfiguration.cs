using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class ProductionOrderConfiguration : IEntityTypeConfiguration<ProductionOrder>
{
    public void Configure(EntityTypeBuilder<ProductionOrder> builder)
    {
        builder.HasKey(x => x.Id);
        
        builder.HasIndex(x => x.ProductionOrderNumber).IsUnique();

        builder.Property(x => x.ProductionOrderNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.PlannedQuantity)
            .HasPrecision(18, 2);

        builder.Property(x => x.StartedQuantity)
            .HasPrecision(18, 2);

        builder.Property(x => x.CompletedQuantity)
            .HasPrecision(18, 2);

        builder.Property(x => x.RejectedQuantity)
            .HasPrecision(18, 2);

        builder.Property(x => x.WorkCenter)
            .HasMaxLength(100);

        builder.Property(x => x.Supervisor)
            .HasMaxLength(100);

        builder.Property(x => x.Remarks)
            .HasMaxLength(500);

        builder.HasOne(x => x.ProductionPlan)
            .WithMany()
            .HasForeignKey(x => x.ProductionPlanId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.BOM)
            .WithMany()
            .HasForeignKey(x => x.BOMId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
