using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class DepartmentConfiguration : IEntityTypeConfiguration<Department>
{
    public void Configure(EntityTypeBuilder<Department> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.DepartmentCode).IsUnique();
        builder.Property(x => x.DepartmentCode).IsRequired().HasMaxLength(20);

        builder.HasIndex(x => x.DepartmentName).IsUnique();
        builder.Property(x => x.DepartmentName).IsRequired().HasMaxLength(100);

        builder.HasOne(x => x.ManagerUser)
               .WithMany()
               .HasForeignKey(x => x.ManagerUserId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Employees)
               .WithOne(x => x.Department)
               .HasForeignKey(x => x.DepartmentId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
