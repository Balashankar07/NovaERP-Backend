using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class ProductionRoutingOperationConfiguration : IEntityTypeConfiguration<ProductionRoutingOperation>
{
    public void Configure(EntityTypeBuilder<ProductionRoutingOperation> builder)
    {
        builder.ToTable("ProductionRoutingOperations");
        builder.HasKey(o => o.Id);

        builder.Property(o => o.OperationName).IsRequired().HasMaxLength(150);
        builder.HasIndex(o => new { o.RoutingId, o.SequenceNumber }).IsUnique();

        builder.HasOne(o => o.Routing)
            .WithMany(r => r.Operations)
            .HasForeignKey(o => o.RoutingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(o => o.WorkCenter)
            .WithMany()
            .HasForeignKey(o => o.WorkCenterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Machine)
            .WithMany()
            .HasForeignKey(o => o.MachineId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
