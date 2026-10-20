using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class PackingListItemConfiguration : IEntityTypeConfiguration<PackingListItem>
{
    public void Configure(EntityTypeBuilder<PackingListItem> builder)
    {
        builder.ToTable("PackingListItems");

        builder.HasKey(i => i.Id);

        builder.HasOne(i => i.PackingList)
            .WithMany(p => p.Items)
            .HasForeignKey(i => i.PackingListId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.SalesOrderItem)
            .WithMany()
            .HasForeignKey(i => i.SalesOrderItemId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Product)
            .WithMany()
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Batch)
            .WithMany()
            .HasForeignKey(i => i.BatchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.SerialNumber)
            .WithMany()
            .HasForeignKey(i => i.SerialNumberId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
