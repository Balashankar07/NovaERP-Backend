using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class LeaveRequestConfiguration : IEntityTypeConfiguration<LeaveRequest>
{
    public void Configure(EntityTypeBuilder<LeaveRequest> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.NumberOfDays).HasPrecision(18, 2);

        builder.HasOne(x => x.Employee)
               .WithMany(x => x.LeaveRequests)
               .HasForeignKey(x => x.EmployeeId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.LeaveType)
               .WithMany()
               .HasForeignKey(x => x.LeaveTypeId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ApproverUser)
               .WithMany()
               .HasForeignKey(x => x.ApproverUserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
