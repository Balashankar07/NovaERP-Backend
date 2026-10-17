using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class BOMConfiguration : IEntityTypeConfiguration<BOM>
{
    public void Configure(EntityTypeBuilder<BOM> builder)
    {
        builder.ToTable("BOMs");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Version)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.Description)
            .HasMaxLength(500);

        builder.Property(x => x.EffectiveDate)
            .IsRequired();

        builder.HasIndex(x => new { x.ProductId, x.Version })
            .IsUnique();

        builder.HasIndex(x => x.ProductId)
            .IsUnique()
            .HasFilter("\"IsActive\" = true");

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.BOMItems)
            .WithOne(x => x.BOM)
            .HasForeignKey(x => x.BomId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
