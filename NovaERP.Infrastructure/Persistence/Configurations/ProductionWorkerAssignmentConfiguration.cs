using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class ProductionWorkerAssignmentConfiguration : IEntityTypeConfiguration<ProductionWorkerAssignment>
{
    public void Configure(EntityTypeBuilder<ProductionWorkerAssignment> builder)
    {
        builder.ToTable("ProductionWorkerAssignments");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.RoleOrFunction).IsRequired().HasMaxLength(100);
        builder.Property(a => a.Status).IsRequired().HasMaxLength(50);

        builder.HasOne(a => a.ProductionExecution)
            .WithMany()
            .HasForeignKey(a => a.ProductionExecutionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Employee)
            .WithMany()
            .HasForeignKey(a => a.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
