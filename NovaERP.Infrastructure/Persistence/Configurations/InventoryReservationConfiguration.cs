using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class InventoryReservationConfiguration : IEntityTypeConfiguration<InventoryReservation>
{
    public void Configure(EntityTypeBuilder<InventoryReservation> builder)
    {
        builder.ToTable("InventoryReservations");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.QuantityReserved)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(e => e.QuantityConsumed)
            .HasColumnType("decimal(18,2)")
            .IsRequired()
            .HasDefaultValue(0);

        builder.HasOne(e => e.ProductionOrder)
            .WithMany(o => o.Reservations)
            .HasForeignKey(e => e.ProductionOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.ProductionOrderRequirement)
            .WithMany(r => r.Reservations)
            .HasForeignKey(e => e.ProductionOrderRequirementId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Inventory)
            .WithMany()
            .HasForeignKey(e => e.InventoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Warehouse)
            .WithMany()
            .HasForeignKey(e => e.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.WarehouseLocation)
            .WithMany()
            .HasForeignKey(e => e.WarehouseLocationId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
