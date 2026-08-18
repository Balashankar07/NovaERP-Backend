using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class PurchaseRequestConfiguration : IEntityTypeConfiguration<PurchaseRequest>
{
    public void Configure(EntityTypeBuilder<PurchaseRequest> builder)
    {
        builder.HasKey(x => x.Id);
        
        builder.Property(x => x.RequestNumber)
            .IsRequired()
            .HasMaxLength(50);
            
        builder.HasIndex(x => x.RequestNumber)
            .IsUnique();
            
        builder.Property(x => x.RequestedBy)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(x => x.Department)
            .HasMaxLength(100);
            
        builder.Property(x => x.Reason)
            .HasMaxLength(500);
            
        builder.Property(x => x.ApprovedBy)
            .HasMaxLength(100);
            
        builder.Property(x => x.RejectionReason)
            .HasMaxLength(500);
            
        builder.HasMany(x => x.Items)
            .WithOne(x => x.PurchaseRequest)
            .HasForeignKey(x => x.PurchaseRequestId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
