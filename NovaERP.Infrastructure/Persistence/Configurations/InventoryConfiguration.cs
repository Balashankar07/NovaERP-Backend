using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class InventoryConfiguration : IEntityTypeConfiguration<Inventory>
{
    public void Configure(EntityTypeBuilder<Inventory> builder)
    {
        builder.HasKey(x => x.Id);

        // Unique constraint: one inventory record per Product + Warehouse + Location
        builder.HasIndex(x => new { x.ProductId, x.WarehouseId, x.WarehouseLocationId })
               .IsUnique()
               .HasDatabaseName("IX_Inventory_Product_Warehouse_Location");

        builder.Property(x => x.QuantityOnHand)
               .HasColumnType("decimal(18,2)")
               .HasDefaultValue(0);

        builder.Property(x => x.QuantityReserved)
               .HasColumnType("decimal(18,2)")
               .HasDefaultValue(0);

        builder.Property(x => x.QuantityAvailable)
               .HasColumnType("decimal(18,2)")
               .HasDefaultValue(0);

        builder.Property(x => x.ReorderLevel)
               .HasColumnType("decimal(18,2)")
               .HasDefaultValue(0);

        builder.Property(x => x.MinimumLevel)
               .HasColumnType("decimal(18,2)")
               .HasDefaultValue(0);

        builder.Property(x => x.MaximumLevel)
               .HasColumnType("decimal(18,2)")
               .HasDefaultValue(0);

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
               .OnDelete(DeleteBehavior.Restrict)
               .IsRequired(false);

        builder.HasMany(x => x.Transactions)
               .WithOne(x => x.Inventory)
               .HasForeignKey(x => x.InventoryId)
               .OnDelete(DeleteBehavior.Restrict);

        // Concurrency token mapped to PostgreSQL hidden xmin column
        builder.Property(x => x.Version)
               .IsRowVersion()
               .HasColumnName("xmin")
               .HasColumnType("xid");
    }
}
