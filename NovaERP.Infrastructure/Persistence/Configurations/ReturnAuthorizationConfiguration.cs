using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class ReturnAuthorizationConfiguration : IEntityTypeConfiguration<ReturnAuthorization>
{
    public void Configure(EntityTypeBuilder<ReturnAuthorization> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.RmaNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(e => e.RmaNumber)
            .IsUnique();

        builder.HasOne(e => e.CustomerReturn)
            .WithOne(r => r.RMA)
            .HasForeignKey<ReturnAuthorization>(e => e.CustomerReturnId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.AuthorizedByUser)
            .WithMany()
            .HasForeignKey(e => e.AuthorizedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
