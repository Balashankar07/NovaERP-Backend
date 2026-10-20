using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class ReplacementOrderConfiguration : IEntityTypeConfiguration<ReplacementOrder>
{
    public void Configure(EntityTypeBuilder<ReplacementOrder> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.ReplacementNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(e => e.ReplacementNumber)
            .IsUnique();

        builder.Property(e => e.Quantity)
            .HasPrecision(18, 4);

        builder.HasOne(e => e.CustomerReturn)
            .WithMany(r => r.Replacements)
            .HasForeignKey(e => e.CustomerReturnId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Warehouse)
            .WithMany()
            .HasForeignKey(e => e.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Shipment)
            .WithMany()
            .HasForeignKey(e => e.ShipmentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
