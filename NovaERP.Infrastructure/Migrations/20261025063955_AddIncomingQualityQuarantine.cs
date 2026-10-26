using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIncomingQualityQuarantine : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsQuarantine",
                table: "WarehouseLocations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "GoodsReceiptId",
                table: "QualityInspections",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "GoodsReceiptItemId",
                table: "QualityInspections",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SourceWarehouseLocationId",
                table: "QualityInspections",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_QualityInspections_GoodsReceiptId",
                table: "QualityInspections",
                column: "GoodsReceiptId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityInspections_GoodsReceiptItemId",
                table: "QualityInspections",
                column: "GoodsReceiptItemId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityInspections_SourceWarehouseLocationId",
                table: "QualityInspections",
                column: "SourceWarehouseLocationId");

            migrationBuilder.AddForeignKey(
                name: "FK_QualityInspections_GoodsReceiptItems_GoodsReceiptItemId",
                table: "QualityInspections",
                column: "GoodsReceiptItemId",
                principalTable: "GoodsReceiptItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_QualityInspections_GoodsReceipts_GoodsReceiptId",
                table: "QualityInspections",
                column: "GoodsReceiptId",
                principalTable: "GoodsReceipts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_QualityInspections_WarehouseLocations_SourceWarehouseLocati~",
                table: "QualityInspections",
                column: "SourceWarehouseLocationId",
                principalTable: "WarehouseLocations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QualityInspections_GoodsReceiptItems_GoodsReceiptItemId",
                table: "QualityInspections");

            migrationBuilder.DropForeignKey(
                name: "FK_QualityInspections_GoodsReceipts_GoodsReceiptId",
                table: "QualityInspections");

            migrationBuilder.DropForeignKey(
                name: "FK_QualityInspections_WarehouseLocations_SourceWarehouseLocati~",
                table: "QualityInspections");

            migrationBuilder.DropIndex(
                name: "IX_QualityInspections_GoodsReceiptId",
                table: "QualityInspections");

            migrationBuilder.DropIndex(
                name: "IX_QualityInspections_GoodsReceiptItemId",
                table: "QualityInspections");

            migrationBuilder.DropIndex(
                name: "IX_QualityInspections_SourceWarehouseLocationId",
                table: "QualityInspections");

            migrationBuilder.DropColumn(
                name: "IsQuarantine",
                table: "WarehouseLocations");

            migrationBuilder.DropColumn(
                name: "GoodsReceiptId",
                table: "QualityInspections");

            migrationBuilder.DropColumn(
                name: "GoodsReceiptItemId",
                table: "QualityInspections");

            migrationBuilder.DropColumn(
                name: "SourceWarehouseLocationId",
                table: "QualityInspections");
        }
    }
}
