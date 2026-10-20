using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class PackingListConfiguration : IEntityTypeConfiguration<PackingList>
{
    public void Configure(EntityTypeBuilder<PackingList> builder)
    {
        builder.ToTable("PackingLists");

        builder.HasKey(p => p.Id);

        builder.HasIndex(p => p.PackingListNumber).IsUnique();

        builder.Property(p => p.PackingListNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasOne(p => p.Shipment)
            .WithMany()
            .HasForeignKey(p => p.ShipmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.SalesOrder)
            .WithMany()
            .HasForeignKey(p => p.SalesOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Customer)
            .WithMany()
            .HasForeignKey(p => p.DistributorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Warehouse)
            .WithMany()
            .HasForeignKey(p => p.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.PackedByUser)
            .WithMany()
            .HasForeignKey(p => p.PackedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
