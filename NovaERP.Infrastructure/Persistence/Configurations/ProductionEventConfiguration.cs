using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class ProductionEventConfiguration : IEntityTypeConfiguration<ProductionEvent>
{
    public void Configure(EntityTypeBuilder<ProductionEvent> builder)
    {
        builder.ToTable("ProductionEvents");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Reason).IsRequired().HasMaxLength(250);

        builder.HasOne(e => e.ProductionExecution)
            .WithMany()
            .HasForeignKey(e => e.ProductionExecutionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Machine)
            .WithMany()
            .HasForeignKey(e => e.MachineId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Employee)
            .WithMany()
            .HasForeignKey(e => e.EmployeeId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
