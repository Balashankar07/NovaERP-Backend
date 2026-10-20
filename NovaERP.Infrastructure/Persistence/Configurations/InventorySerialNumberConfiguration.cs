using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class InventorySerialNumberConfiguration : IEntityTypeConfiguration<InventorySerialNumber>
{
    public void Configure(EntityTypeBuilder<InventorySerialNumber> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.SerialNumber).IsUnique();

        builder.Property(x => x.SerialNumber)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Barcode)
            .HasMaxLength(150);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Warehouse)
            .WithMany()
            .HasForeignKey(x => x.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.WarehouseLocation)
            .WithMany()
            .HasForeignKey(x => x.WarehouseLocationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Batch)
            .WithMany(b => b.SerialNumbers)
            .HasForeignKey(x => x.BatchId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
