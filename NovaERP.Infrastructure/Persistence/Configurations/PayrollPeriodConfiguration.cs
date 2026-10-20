using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class PayrollPeriodConfiguration : IEntityTypeConfiguration<PayrollPeriod>
{
    public void Configure(EntityTypeBuilder<PayrollPeriod> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.PeriodName).IsUnique();
        builder.Property(x => x.PeriodName).IsRequired().HasMaxLength(50);

        builder.HasMany(x => x.Entries)
               .WithOne(x => x.Period)
               .HasForeignKey(x => x.PeriodId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
