using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class JournalEntryConfiguration : IEntityTypeConfiguration<JournalEntry>
{
    public void Configure(EntityTypeBuilder<JournalEntry> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.EntryNumber).IsUnique();
        builder.Property(x => x.EntryNumber).IsRequired().HasMaxLength(50);

        builder.Property(x => x.TotalDebit).HasPrecision(18, 2);
        builder.Property(x => x.TotalCredit).HasPrecision(18, 2);

        builder.HasMany(x => x.Lines)
               .WithOne(x => x.JournalEntry)
               .HasForeignKey(x => x.JournalEntryId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
