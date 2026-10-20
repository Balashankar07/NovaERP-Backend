using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class CustomerReturnItemConfiguration : IEntityTypeConfiguration<CustomerReturnItem>
{
    public void Configure(EntityTypeBuilder<CustomerReturnItem> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Quantity)
            .HasPrecision(18, 4);

        builder.HasOne(e => e.CustomerReturn)
            .WithMany(r => r.Items)
            .HasForeignKey(e => e.CustomerReturnId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
