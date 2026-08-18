using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class ProductionOrderRequirementConfiguration : IEntityTypeConfiguration<ProductionOrderRequirement>
{
    public void Configure(EntityTypeBuilder<ProductionOrderRequirement> builder)
    {
        builder.ToTable("ProductionOrderRequirements");

        builder.HasKey(e => e.Id);

        builder.HasIndex(e => new { e.ProductionOrderId, e.ProductId }).IsUnique();

        builder.Property(e => e.RequiredQuantity)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(e => e.ConsumedQuantity)
            .HasColumnType("decimal(18,2)")
            .IsRequired()
            .HasDefaultValue(0);

        builder.HasOne(e => e.ProductionOrder)
            .WithMany(o => o.Requirements)
            .HasForeignKey(e => e.ProductionOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Unit)
            .WithMany()
            .HasForeignKey(e => e.UnitId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
