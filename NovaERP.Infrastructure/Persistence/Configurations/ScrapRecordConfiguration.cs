using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class ScrapRecordConfiguration : IEntityTypeConfiguration<ScrapRecord>
{
    public void Configure(EntityTypeBuilder<ScrapRecord> builder)
    {
        builder.ToTable("ScrapRecords");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.ScrapNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(s => s.ScrapNumber)
            .IsUnique();

        builder.Property(s => s.Quantity)
            .HasPrecision(18, 4);

        builder.Property(s => s.Reason)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(s => s.Remarks)
            .HasMaxLength(1000);

        // Relationships
        builder.HasOne(s => s.QualityInspection)
            .WithMany()
            .HasForeignKey(s => s.QualityInspectionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.NonConformanceReport)
            .WithMany(n => n.ScrapRecords)
            .HasForeignKey(s => s.NcrId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Product)
            .WithMany()
            .HasForeignKey(s => s.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Warehouse)
            .WithMany()
            .HasForeignKey(s => s.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.WarehouseLocation)
            .WithMany()
            .HasForeignKey(s => s.WarehouseLocationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Batch)
            .WithMany()
            .HasForeignKey(s => s.BatchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.SerialNumber)
            .WithMany()
            .HasForeignKey(s => s.SerialNumberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.ApprovedByUser)
            .WithMany()
            .HasForeignKey(s => s.ApprovedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
