using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class ReworkRequestConfiguration : IEntityTypeConfiguration<ReworkRequest>
{
    public void Configure(EntityTypeBuilder<ReworkRequest> builder)
    {
        builder.ToTable("ReworkRequests");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.ReworkNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(r => r.ReworkNumber)
            .IsUnique();

        builder.Property(r => r.Quantity)
            .HasPrecision(18, 4);

        builder.Property(r => r.Reason)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(r => r.Remarks)
            .HasMaxLength(1000);

        // Relationships
        builder.HasOne(r => r.QualityInspection)
            .WithMany()
            .HasForeignKey(r => r.QualityInspectionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.NonConformanceReport)
            .WithMany(n => n.ReworkRequests)
            .HasForeignKey(r => r.NcrId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.ProductionExecution)
            .WithMany()
            .HasForeignKey(r => r.ProductionExecutionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Product)
            .WithMany()
            .HasForeignKey(r => r.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.AssignedWorkCenter)
            .WithMany()
            .HasForeignKey(r => r.AssignedWorkCenterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.AssignedEmployee)
            .WithMany()
            .HasForeignKey(r => r.AssignedEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.ApprovedByUser)
            .WithMany()
            .HasForeignKey(r => r.ApprovedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
