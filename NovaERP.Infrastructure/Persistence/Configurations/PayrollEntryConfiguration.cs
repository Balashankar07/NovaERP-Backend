using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class PayrollEntryConfiguration : IEntityTypeConfiguration<PayrollEntry>
{
    public void Configure(EntityTypeBuilder<PayrollEntry> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => new { x.PeriodId, x.EmployeeId }).IsUnique();

        builder.Property(x => x.BaseSalary).HasPrecision(18, 2);
        builder.Property(x => x.Allowances).HasPrecision(18, 2);
        builder.Property(x => x.Deductions).HasPrecision(18, 2);
        builder.Property(x => x.GrossPay).HasPrecision(18, 2);
        builder.Property(x => x.NetPay).HasPrecision(18, 2);

        builder.HasOne(x => x.Period)
               .WithMany(x => x.Entries)
               .HasForeignKey(x => x.PeriodId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Employee)
               .WithMany(x => x.PayrollEntries)
               .HasForeignKey(x => x.EmployeeId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ApprovalJournalEntry)
               .WithMany()
               .HasForeignKey(x => x.ApprovalJournalEntryId)
               .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.PaymentJournalEntry)
               .WithMany()
               .HasForeignKey(x => x.PaymentJournalEntryId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}
