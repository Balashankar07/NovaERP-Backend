using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class WarehouseLocationConfiguration : IEntityTypeConfiguration<WarehouseLocation>
{
    public void Configure(EntityTypeBuilder<WarehouseLocation> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => new { x.WarehouseId, x.LocationCode }).IsUnique();
        builder.HasIndex(x => new { x.WarehouseId, x.LocationName }).IsUnique();

        builder.Property(x => x.LocationCode)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.LocationName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Zone)
            .HasMaxLength(50);

        builder.Property(x => x.Rack)
            .HasMaxLength(50);

        builder.Property(x => x.Shelf)
            .HasMaxLength(50);

        builder.Property(x => x.Bin)
            .HasMaxLength(50);

        builder.Property(x => x.Description)
            .HasMaxLength(500);

        builder.Property(x => x.IsQuarantine)
            .HasDefaultValue(false);

        builder.HasOne(x => x.ParentLocation)
            .WithMany(x => x.ChildLocations)
            .HasForeignKey(x => x.ParentLocationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
