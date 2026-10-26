using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class QualityInspectionConfiguration : IEntityTypeConfiguration<QualityInspection>
{
    public void Configure(EntityTypeBuilder<QualityInspection> builder)
    {
        builder.ToTable("QualityInspections");

        builder.HasKey(qi => qi.Id);

        builder.Property(qi => qi.InspectionNumber)
            .IsRequired()
            .HasMaxLength(50);
            
        builder.HasIndex(qi => qi.InspectionNumber)
            .IsUnique();

        builder.Property(qi => qi.InspectedQuantity)
            .HasPrecision(18, 2);

        builder.Property(qi => qi.PassedQuantity)
            .HasPrecision(18, 2);

        builder.Property(qi => qi.FailedQuantity)
            .HasPrecision(18, 2);

        builder.Property(qi => qi.Remarks)
            .HasMaxLength(1000);

        builder.HasOne(qi => qi.ProductionExecution)
            .WithMany()
            .HasForeignKey(qi => qi.ProductionExecutionId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(qi => qi.GoodsReceipt)
            .WithMany()
            .HasForeignKey(qi => qi.GoodsReceiptId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(qi => qi.GoodsReceiptItem)
            .WithMany()
            .HasForeignKey(qi => qi.GoodsReceiptItemId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(qi => qi.SourceWarehouseLocation)
            .WithMany()
            .HasForeignKey(qi => qi.SourceWarehouseLocationId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(qi => qi.Product)
            .WithMany()
            .HasForeignKey(qi => qi.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(qi => qi.Inspector)
            .WithMany()
            .HasForeignKey(qi => qi.InspectorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(qi => qi.OutputWarehouse)
            .WithMany()
            .HasForeignKey(qi => qi.OutputWarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(qi => qi.OutputWarehouseLocation)
            .WithMany()
            .HasForeignKey(qi => qi.OutputWarehouseLocationId)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasMany(qi => qi.QualityDefects)
            .WithOne(qd => qd.QualityInspection)
            .HasForeignKey(qd => qd.QualityInspectionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
