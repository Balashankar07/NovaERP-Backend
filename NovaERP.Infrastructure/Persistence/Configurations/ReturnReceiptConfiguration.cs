using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class ReturnReceiptConfiguration : IEntityTypeConfiguration<ReturnReceipt>
{
    public void Configure(EntityTypeBuilder<ReturnReceipt> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.ReceiptNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(e => e.ReceiptNumber)
            .IsUnique();

        builder.Property(e => e.Quantity)
            .HasPrecision(18, 4);

        builder.HasOne(e => e.CustomerReturn)
            .WithMany(r => r.Receipts)
            .HasForeignKey(e => e.CustomerReturnId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ReturnAuthorization)
            .WithMany()
            .HasForeignKey(e => e.ReturnAuthorizationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Warehouse)
            .WithMany()
            .HasForeignKey(e => e.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.WarehouseLocation)
            .WithMany()
            .HasForeignKey(e => e.WarehouseLocationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ReceivedByUser)
            .WithMany()
            .HasForeignKey(e => e.ReceivedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.QualityInspection)
            .WithMany()
            .HasForeignKey(e => e.QualityInspectionId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
