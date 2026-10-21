using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReceivedQuantityAndStatusesToProcurement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE IF EXISTS ""PurchaseOrderItems"" ADD COLUMN IF NOT EXISTS ""ReceivedQuantity"" numeric(18,2) NOT NULL DEFAULT 0;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE IF EXISTS ""PurchaseOrderItems"" DROP COLUMN IF EXISTS ""ReceivedQuantity"";
            ");
        }
    }
}
