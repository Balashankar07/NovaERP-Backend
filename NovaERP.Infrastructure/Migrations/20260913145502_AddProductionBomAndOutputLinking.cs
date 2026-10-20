using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductionBomAndOutputLinking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "BOMId",
                table: "ProductionPlans",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "BOMId",
                table: "ProductionOrders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OutputWarehouseId",
                table: "ProductionExecutions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OutputWarehouseLocationId",
                table: "ProductionExecutions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductionPlans_BOMId",
                table: "ProductionPlans",
                column: "BOMId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionOrders_BOMId",
                table: "ProductionOrders",
                column: "BOMId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionExecutions_OutputWarehouseId",
                table: "ProductionExecutions",
                column: "OutputWarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionExecutions_OutputWarehouseLocationId",
                table: "ProductionExecutions",
                column: "OutputWarehouseLocationId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductionExecutions_WarehouseLocations_OutputWarehouseLoca~",
                table: "ProductionExecutions",
                column: "OutputWarehouseLocationId",
                principalTable: "WarehouseLocations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductionExecutions_Warehouses_OutputWarehouseId",
                table: "ProductionExecutions",
                column: "OutputWarehouseId",
                principalTable: "Warehouses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductionOrders_BOMs_BOMId",
                table: "ProductionOrders",
                column: "BOMId",
                principalTable: "BOMs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductionPlans_BOMs_BOMId",
                table: "ProductionPlans",
                column: "BOMId",
                principalTable: "BOMs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductionExecutions_WarehouseLocations_OutputWarehouseLoca~",
                table: "ProductionExecutions");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductionExecutions_Warehouses_OutputWarehouseId",
                table: "ProductionExecutions");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductionOrders_BOMs_BOMId",
                table: "ProductionOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductionPlans_BOMs_BOMId",
                table: "ProductionPlans");

            migrationBuilder.DropIndex(
                name: "IX_ProductionPlans_BOMId",
                table: "ProductionPlans");

            migrationBuilder.DropIndex(
                name: "IX_ProductionOrders_BOMId",
                table: "ProductionOrders");

            migrationBuilder.DropIndex(
                name: "IX_ProductionExecutions_OutputWarehouseId",
                table: "ProductionExecutions");

            migrationBuilder.DropIndex(
                name: "IX_ProductionExecutions_OutputWarehouseLocationId",
                table: "ProductionExecutions");

            migrationBuilder.DropColumn(
                name: "BOMId",
                table: "ProductionPlans");

            migrationBuilder.DropColumn(
                name: "BOMId",
                table: "ProductionOrders");

            migrationBuilder.DropColumn(
                name: "OutputWarehouseId",
                table: "ProductionExecutions");

            migrationBuilder.DropColumn(
                name: "OutputWarehouseLocationId",
                table: "ProductionExecutions");
        }
    }
}
