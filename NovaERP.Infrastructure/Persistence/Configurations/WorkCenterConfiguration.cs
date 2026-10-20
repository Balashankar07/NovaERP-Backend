using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class WorkCenterConfiguration : IEntityTypeConfiguration<WorkCenter>
{
    public void Configure(EntityTypeBuilder<WorkCenter> builder)
    {
        builder.ToTable("WorkCenters");
        builder.HasKey(w => w.Id);

        builder.Property(w => w.Code).IsRequired().HasMaxLength(50);
        builder.HasIndex(w => w.Code).IsUnique();

        builder.Property(w => w.Name).IsRequired().HasMaxLength(150);
        builder.Property(w => w.Capacity).HasPrecision(18, 2);

        builder.HasOne(w => w.Department)
            .WithMany()
            .HasForeignKey(w => w.DepartmentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(w => w.Warehouse)
            .WithMany()
            .HasForeignKey(w => w.WarehouseId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
