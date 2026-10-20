using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class ChartOfAccountConfiguration : IEntityTypeConfiguration<ChartOfAccount>
{
    public void Configure(EntityTypeBuilder<ChartOfAccount> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.AccountCode).IsUnique();
        builder.Property(x => x.AccountCode).IsRequired().HasMaxLength(20);
        builder.Property(x => x.AccountName).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Description).HasMaxLength(250);
    }
}
