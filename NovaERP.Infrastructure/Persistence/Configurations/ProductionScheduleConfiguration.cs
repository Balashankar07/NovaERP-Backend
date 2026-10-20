using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class ProductionScheduleConfiguration : IEntityTypeConfiguration<ProductionSchedule>
{
    public void Configure(EntityTypeBuilder<ProductionSchedule> builder)
    {
        builder.ToTable("ProductionSchedules");
        builder.HasKey(s => s.Id);

        builder.HasOne(s => s.ProductionOrder)
            .WithMany()
            .HasForeignKey(s => s.ProductionOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Operation)
            .WithMany()
            .HasForeignKey(s => s.OperationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(s => s.WorkCenter)
            .WithMany()
            .HasForeignKey(s => s.WorkCenterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Machine)
            .WithMany()
            .HasForeignKey(s => s.MachineId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
