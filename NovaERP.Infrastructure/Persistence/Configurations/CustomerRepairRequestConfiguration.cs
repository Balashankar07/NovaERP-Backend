using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class CustomerRepairRequestConfiguration : IEntityTypeConfiguration<CustomerRepairRequest>
{
    public void Configure(EntityTypeBuilder<CustomerRepairRequest> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.RepairNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(e => e.RepairNumber)
            .IsUnique();

        builder.HasOne(e => e.CustomerReturn)
            .WithMany(r => r.Repairs)
            .HasForeignKey(e => e.CustomerReturnId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ReturnAuthorization)
            .WithMany()
            .HasForeignKey(e => e.ReturnAuthorizationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.AssignedEmployee)
            .WithMany()
            .HasForeignKey(e => e.AssignedEmployeeId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.WorkCenter)
            .WithMany()
            .HasForeignKey(e => e.WorkCenterId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Reinspection)
            .WithMany()
            .HasForeignKey(e => e.ReinspectionId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
