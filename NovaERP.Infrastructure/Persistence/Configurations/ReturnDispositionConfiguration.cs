using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class ReturnDispositionConfiguration : IEntityTypeConfiguration<ReturnDisposition>
{
    public void Configure(EntityTypeBuilder<ReturnDisposition> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.DispositionNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(e => e.DispositionNumber)
            .IsUnique();

        builder.Property(e => e.Quantity)
            .HasPrecision(18, 4);

        builder.HasOne(e => e.CustomerReturn)
            .WithMany(r => r.Dispositions)
            .HasForeignKey(e => e.CustomerReturnId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ReturnReceipt)
            .WithMany()
            .HasForeignKey(e => e.ReturnReceiptId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ApprovedByUser)
            .WithMany()
            .HasForeignKey(e => e.ApprovedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
