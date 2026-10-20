using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Configurations;

public class ShipmentDocumentConfiguration : IEntityTypeConfiguration<ShipmentDocument>
{
    public void Configure(EntityTypeBuilder<ShipmentDocument> builder)
    {
        builder.ToTable("ShipmentDocuments");

        builder.HasKey(s => s.Id);

        builder.HasOne(s => s.Shipment)
            .WithMany()
            .HasForeignKey(s => s.ShipmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.GeneratedByUser)
            .WithMany()
            .HasForeignKey(s => s.GeneratedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.PackingList)
            .WithMany()
            .HasForeignKey(s => s.PackingListId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(s => s.DeliveryChallan)
            .WithMany()
            .HasForeignKey(s => s.DeliveryChallanId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(s => s.CustomerInvoice)
            .WithMany()
            .HasForeignKey(s => s.CustomerInvoiceId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
