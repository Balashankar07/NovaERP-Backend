using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class ProductionPlanConfiguration : IEntityTypeConfiguration<ProductionPlan>
{
    public void Configure(EntityTypeBuilder<ProductionPlan> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.PlanNumber)
               .IsRequired()
               .HasMaxLength(50);
        
        builder.HasIndex(x => x.PlanNumber)
               .IsUnique()
               .HasDatabaseName("IX_ProductionPlan_PlanNumber");

        builder.Property(x => x.PlannedQuantity)
               .HasColumnType("decimal(18,2)")
               .IsRequired();

        builder.Property(x => x.Remarks)
               .HasMaxLength(1000);

        builder.HasOne(x => x.Product)
               .WithMany()
               .HasForeignKey(x => x.ProductId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.BOM)
               .WithMany()
               .HasForeignKey(x => x.BOMId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Requirements)
               .WithOne(x => x.ProductionPlan)
               .HasForeignKey(x => x.ProductionPlanId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
