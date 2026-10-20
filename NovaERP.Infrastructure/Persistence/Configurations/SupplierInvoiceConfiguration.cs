using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class SupplierInvoiceConfiguration : IEntityTypeConfiguration<SupplierInvoice>
{
    public void Configure(EntityTypeBuilder<SupplierInvoice> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.InvoiceNumber).IsUnique();
        builder.Property(x => x.InvoiceNumber).IsRequired().HasMaxLength(50);

        builder.Property(x => x.SubTotal).HasPrecision(18, 2);
        builder.Property(x => x.TaxRate).HasPrecision(18, 2);
        builder.Property(x => x.TaxAmount).HasPrecision(18, 2);
        builder.Property(x => x.TotalAmount).HasPrecision(18, 2);
        builder.Property(x => x.AmountPaid).HasPrecision(18, 2);
        builder.Property(x => x.BalanceDue).HasPrecision(18, 2);

        builder.HasMany(x => x.Items)
               .WithOne(x => x.SupplierInvoice)
               .HasForeignKey(x => x.SupplierInvoiceId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
