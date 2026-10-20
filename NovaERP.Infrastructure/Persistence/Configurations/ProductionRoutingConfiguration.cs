using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class ProductionRoutingConfiguration : IEntityTypeConfiguration<ProductionRouting>
{
    public void Configure(EntityTypeBuilder<ProductionRouting> builder)
    {
        builder.ToTable("ProductionRoutings");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Version).IsRequired().HasMaxLength(20);
        builder.HasIndex(r => new { r.ProductId, r.Version }).IsUnique();

        builder.HasOne(r => r.Product)
            .WithMany()
            .HasForeignKey(r => r.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
