using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class AttendanceRecordConfiguration : IEntityTypeConfiguration<AttendanceRecord>
{
    public void Configure(EntityTypeBuilder<AttendanceRecord> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => new { x.EmployeeId, x.AttendanceDate }).IsUnique();

        builder.Property(x => x.WorkHours).HasPrecision(18, 2);

        builder.HasOne(x => x.Employee)
               .WithMany(x => x.AttendanceRecords)
               .HasForeignKey(x => x.EmployeeId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
