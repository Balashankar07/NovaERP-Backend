using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddQualityWarehouseTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OutputWarehouseId",
                table: "QualityInspections",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OutputWarehouseLocationId",
                table: "QualityInspections",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_QualityInspections_OutputWarehouseId",
                table: "QualityInspections",
                column: "OutputWarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityInspections_OutputWarehouseLocationId",
                table: "QualityInspections",
                column: "OutputWarehouseLocationId");

            migrationBuilder.AddForeignKey(
                name: "FK_QualityInspections_WarehouseLocations_OutputWarehouseLocati~",
                table: "QualityInspections",
                column: "OutputWarehouseLocationId",
                principalTable: "WarehouseLocations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_QualityInspections_Warehouses_OutputWarehouseId",
                table: "QualityInspections",
                column: "OutputWarehouseId",
                principalTable: "Warehouses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QualityInspections_WarehouseLocations_OutputWarehouseLocati~",
                table: "QualityInspections");

            migrationBuilder.DropForeignKey(
                name: "FK_QualityInspections_Warehouses_OutputWarehouseId",
                table: "QualityInspections");

            migrationBuilder.DropIndex(
                name: "IX_QualityInspections_OutputWarehouseId",
                table: "QualityInspections");

            migrationBuilder.DropIndex(
                name: "IX_QualityInspections_OutputWarehouseLocationId",
                table: "QualityInspections");

            migrationBuilder.DropColumn(
                name: "OutputWarehouseId",
                table: "QualityInspections");

            migrationBuilder.DropColumn(
                name: "OutputWarehouseLocationId",
                table: "QualityInspections");
        }
    }
}
