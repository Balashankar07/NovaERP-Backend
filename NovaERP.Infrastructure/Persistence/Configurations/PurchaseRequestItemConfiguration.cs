using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class PurchaseRequestItemConfiguration : IEntityTypeConfiguration<PurchaseRequestItem>
{
    public void Configure(EntityTypeBuilder<PurchaseRequestItem> builder)
    {
        builder.HasKey(x => x.Id);
        
        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.Property(x => x.Remarks)
            .HasMaxLength(500);
            
        builder.Property(x => x.RequestedQuantity).HasPrecision(18, 2);
        builder.Property(x => x.ApprovedQuantity).HasPrecision(18, 2);
        builder.Property(x => x.ConvertedQuantity).HasPrecision(18, 2);
    }
}
