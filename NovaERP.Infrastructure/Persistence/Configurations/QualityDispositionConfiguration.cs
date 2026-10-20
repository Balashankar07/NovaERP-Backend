using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class QualityDispositionConfiguration : IEntityTypeConfiguration<QualityDisposition>
{
    public void Configure(EntityTypeBuilder<QualityDisposition> builder)
    {
        builder.ToTable("QualityDispositions");

        builder.HasKey(q => q.Id);

        builder.Property(q => q.DispositionNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(q => q.DispositionNumber)
            .IsUnique();

        builder.Property(q => q.Quantity)
            .HasPrecision(18, 4);

        builder.Property(q => q.Reason)
            .IsRequired()
            .HasMaxLength(1000);

        // Relationships
        builder.HasOne(q => q.QualityInspection)
            .WithMany()
            .HasForeignKey(q => q.QualityInspectionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(q => q.NonConformanceReport)
            .WithMany(n => n.QualityDispositions)
            .HasForeignKey(q => q.NcrId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(q => q.Product)
            .WithMany()
            .HasForeignKey(q => q.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(q => q.Warehouse)
            .WithMany()
            .HasForeignKey(q => q.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(q => q.WarehouseLocation)
            .WithMany()
            .HasForeignKey(q => q.WarehouseLocationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(q => q.Batch)
            .WithMany()
            .HasForeignKey(q => q.BatchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(q => q.SerialNumber)
            .WithMany()
            .HasForeignKey(q => q.SerialNumberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(q => q.ApprovedByUser)
            .WithMany()
            .HasForeignKey(q => q.ApprovedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
