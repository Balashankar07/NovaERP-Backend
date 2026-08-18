using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class SupplierProductConfiguration : IEntityTypeConfiguration<SupplierProduct>
{
    public void Configure(EntityTypeBuilder<SupplierProduct> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Supplier)
            .WithMany()
            .HasForeignKey(x => x.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(x => x.SupplierSKU)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Currency)
            .IsRequired()
            .HasMaxLength(10);
            
        builder.HasIndex(x => x.SupplierId);
        builder.HasIndex(x => x.ProductId);
        builder.HasIndex(x => x.IsActive);
        
        // Ensure at most one active preferred supplier per product
        builder.HasIndex(x => x.ProductId)
            .IsUnique()
            .HasFilter("\"IsActive\" = true AND \"IsPreferred\" = true");
            
        // Ensure unique active supplier-product relationship
        builder.HasIndex(x => new { x.SupplierId, x.ProductId })
            .IsUnique()
            .HasFilter("\"IsActive\" = true");
    }
}
