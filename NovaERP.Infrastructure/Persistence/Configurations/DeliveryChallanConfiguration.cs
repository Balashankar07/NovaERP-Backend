using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class DeliveryChallanConfiguration : IEntityTypeConfiguration<DeliveryChallan>
{
    public void Configure(EntityTypeBuilder<DeliveryChallan> builder)
    {
        builder.ToTable("DeliveryChallans");

        builder.HasKey(d => d.Id);

        builder.HasIndex(d => d.ChallanNumber).IsUnique();

        builder.Property(d => d.ChallanNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasOne(d => d.Shipment)
            .WithMany()
            .HasForeignKey(d => d.ShipmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.SalesOrder)
            .WithMany()
            .HasForeignKey(d => d.SalesOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.Customer)
            .WithMany()
            .HasForeignKey(d => d.DistributorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.Warehouse)
            .WithMany()
            .HasForeignKey(d => d.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.IssuedByUser)
            .WithMany()
            .HasForeignKey(d => d.IssuedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
