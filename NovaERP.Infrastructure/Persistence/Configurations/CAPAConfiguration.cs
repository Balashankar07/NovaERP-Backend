using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class CAPAConfiguration : IEntityTypeConfiguration<CAPA>
{
    public void Configure(EntityTypeBuilder<CAPA> builder)
    {
        builder.ToTable("CAPAs");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.CapaNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(c => c.CapaNumber)
            .IsUnique();

        builder.Property(c => c.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(c => c.RootCause)
            .HasMaxLength(2000);

        builder.Property(c => c.ContainmentAction)
            .HasMaxLength(2000);

        builder.Property(c => c.CorrectiveAction)
            .HasMaxLength(2000);

        builder.Property(c => c.PreventiveAction)
            .HasMaxLength(2000);

        builder.Property(c => c.VerificationNotes)
            .HasMaxLength(2000);

        // Relationships
        builder.HasOne(c => c.NonConformanceReport)
            .WithMany(n => n.CAPAs)
            .HasForeignKey(c => c.NcrId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.OwnerEmployee)
            .WithMany()
            .HasForeignKey(c => c.OwnerEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
