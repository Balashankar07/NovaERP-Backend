using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class NonConformanceReportConfiguration : IEntityTypeConfiguration<NonConformanceReport>
{
    public void Configure(EntityTypeBuilder<NonConformanceReport> builder)
    {
        builder.ToTable("NonConformanceReports");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.NcrNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(n => n.NcrNumber)
            .IsUnique();

        builder.Property(n => n.Category)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(n => n.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(n => n.ContainmentAction)
            .HasMaxLength(2000);

        builder.Property(n => n.RootCauseCategory)
            .HasMaxLength(100);

        builder.Property(n => n.RootCauseDescription)
            .HasMaxLength(2000);

        builder.Property(n => n.CorrectiveAction)
            .HasMaxLength(2000);

        builder.Property(n => n.PreventiveAction)
            .HasMaxLength(2000);

        builder.Property(n => n.ClosureRemarks)
            .HasMaxLength(1000);

        // Relationships
        builder.HasOne(n => n.QualityInspection)
            .WithMany()
            .HasForeignKey(n => n.QualityInspectionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.ProductionExecution)
            .WithMany()
            .HasForeignKey(n => n.ProductionExecutionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.Product)
            .WithMany()
            .HasForeignKey(n => n.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.Batch)
            .WithMany()
            .HasForeignKey(n => n.BatchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.SerialNumber)
            .WithMany()
            .HasForeignKey(n => n.SerialNumberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.ReportedByUser)
            .WithMany()
            .HasForeignKey(n => n.ReportedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.AssignedToUser)
            .WithMany()
            .HasForeignKey(n => n.AssignedToUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
