using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class BOMItemConfiguration : IEntityTypeConfiguration<BOMItem>
{
    public void Configure(EntityTypeBuilder<BOMItem> builder)
    {
        builder.ToTable("BOMItems");

        builder.HasKey(x => x.Id);

        builder.HasIndex(x => new { x.BomId, x.RawMaterialProductId })
            .IsUnique();

        builder.Property(x => x.Quantity)
            .IsRequired()
            .HasColumnType("decimal(18,4)");

        builder.Property(x => x.WastePercentage)
            .HasColumnType("decimal(5,2)");

        builder.Property(x => x.Remarks)
            .HasMaxLength(500);

        builder.HasOne(x => x.RawMaterialProduct)
            .WithMany()
            .HasForeignKey(x => x.RawMaterialProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Unit)
            .WithMany()
            .HasForeignKey(x => x.UnitId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
