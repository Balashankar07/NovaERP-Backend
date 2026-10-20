using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BOMProductionReady : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BOMs_ProductId",
                table: "BOMs");

            // migrationBuilder.DropIndex(
            //    name: "IX_BOMItems_BomId",
            //    table: "BOMItems");

            migrationBuilder.AddColumn<DateTime>(
                name: "EffectiveDate",
                table: "BOMs",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            // Backfill EffectiveDate with CreatedAt for existing records
            migrationBuilder.Sql("UPDATE \"BOMs\" SET \"EffectiveDate\" = \"CreatedAt\";");

            migrationBuilder.CreateIndex(
                name: "IX_BOMs_ProductId",
                table: "BOMs",
                column: "ProductId",
                unique: true,
                filter: "\"IsActive\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_BOMs_ProductId_Version",
                table: "BOMs",
                columns: new[] { "ProductId", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BOMItems_BomId_RawMaterialProductId",
                table: "BOMItems",
                columns: new[] { "BomId", "RawMaterialProductId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BOMs_ProductId",
                table: "BOMs");

            migrationBuilder.DropIndex(
                name: "IX_BOMs_ProductId_Version",
                table: "BOMs");

            migrationBuilder.DropIndex(
                name: "IX_BOMItems_BomId_RawMaterialProductId",
                table: "BOMItems");

            migrationBuilder.DropColumn(
                name: "EffectiveDate",
                table: "BOMs");

            migrationBuilder.CreateIndex(
                name: "IX_BOMs_ProductId",
                table: "BOMs",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_BOMItems_BomId",
                table: "BOMItems",
                column: "BomId");
        }
    }
}
