using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class ProductionExecutionConfiguration : IEntityTypeConfiguration<ProductionExecution>
{
    public void Configure(EntityTypeBuilder<ProductionExecution> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.ExecutionNumber).IsUnique();

        builder.Property(x => x.ExecutionNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.Remarks)
            .HasMaxLength(1000);

        builder.Property(x => x.ProducedQuantity)
            .HasPrecision(18, 4);

        builder.Property(x => x.RejectedQuantity)
            .HasPrecision(18, 4);

        builder.HasOne(x => x.ProductionOrder)
            .WithMany(po => po.ProductionExecutions)
            .HasForeignKey(x => x.ProductionOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.OutputWarehouse)
            .WithMany()
            .HasForeignKey(x => x.OutputWarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.OutputWarehouseLocation)
            .WithMany()
            .HasForeignKey(x => x.OutputWarehouseLocationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
