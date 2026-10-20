using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class MachineConfiguration : IEntityTypeConfiguration<Machine>
{
    public void Configure(EntityTypeBuilder<Machine> builder)
    {
        builder.ToTable("Machines");
        builder.HasKey(m => m.Id);

        builder.Property(m => m.MachineCode).IsRequired().HasMaxLength(50);
        builder.HasIndex(m => m.MachineCode).IsUnique();

        builder.Property(m => m.MachineName).IsRequired().HasMaxLength(150);
        builder.Property(m => m.Capacity).HasPrecision(18, 2);

        builder.HasOne(m => m.WorkCenter)
            .WithMany(w => w.Machines)
            .HasForeignKey(m => m.WorkCenterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
