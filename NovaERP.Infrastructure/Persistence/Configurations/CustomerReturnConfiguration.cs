using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class CustomerReturnConfiguration : IEntityTypeConfiguration<CustomerReturn>
{
    public void Configure(EntityTypeBuilder<CustomerReturn> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.ReturnNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(e => e.ReturnNumber)
            .IsUnique();

        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.SalesOrder)
            .WithMany()
            .HasForeignKey(e => e.SalesOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Shipment)
            .WithMany()
            .HasForeignKey(e => e.ShipmentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.WarrantyClaim)
            .WithMany()
            .HasForeignKey(e => e.WarrantyClaimId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.CreatedByUser)
            .WithMany()
            .HasForeignKey(e => e.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
