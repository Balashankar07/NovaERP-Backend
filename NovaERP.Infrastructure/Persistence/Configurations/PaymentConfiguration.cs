using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.PaymentNumber).IsUnique();
        builder.Property(x => x.PaymentNumber).IsRequired().HasMaxLength(50);

        builder.Property(x => x.Amount).HasPrecision(18, 2);

        builder.HasOne(x => x.CustomerInvoice)
               .WithMany()
               .HasForeignKey(x => x.CustomerInvoiceId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SupplierInvoice)
               .WithMany()
               .HasForeignKey(x => x.SupplierInvoiceId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
