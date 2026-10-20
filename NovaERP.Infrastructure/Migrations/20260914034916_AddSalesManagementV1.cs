using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSalesManagementV1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BillingAddress",
                table: "SalesOrders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "SalesOrders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountAmount",
                table: "SalesOrders",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Remarks",
                table: "SalesOrders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RequiredDeliveryDate",
                table: "SalesOrders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShippingAddress",
                table: "SalesOrders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Subtotal",
                table: "SalesOrders",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxAmount",
                table: "SalesOrders",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Discount",
                table: "SalesOrderItems",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ReservedQuantity",
                table: "SalesOrderItems",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ShippedQuantity",
                table: "SalesOrderItems",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Tax",
                table: "SalesOrderItems",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "SalesOrderItems",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<Guid>(
                name: "ProductionOrderRequirementId",
                table: "InventoryReservations",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<Guid>(
                name: "ProductionOrderId",
                table: "InventoryReservations",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "SalesOrderId",
                table: "InventoryReservations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SalesOrderItemId",
                table: "InventoryReservations",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_InventoryReservations_SalesOrderId",
                table: "InventoryReservations",
                column: "SalesOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryReservations_SalesOrderItemId",
                table: "InventoryReservations",
                column: "SalesOrderItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryReservations_SalesOrderItems_SalesOrderItemId",
                table: "InventoryReservations",
                column: "SalesOrderItemId",
                principalTable: "SalesOrderItems",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryReservations_SalesOrders_SalesOrderId",
                table: "InventoryReservations",
                column: "SalesOrderId",
                principalTable: "SalesOrders",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InventoryReservations_SalesOrderItems_SalesOrderItemId",
                table: "InventoryReservations");

            migrationBuilder.DropForeignKey(
                name: "FK_InventoryReservations_SalesOrders_SalesOrderId",
                table: "InventoryReservations");

            migrationBuilder.DropIndex(
                name: "IX_InventoryReservations_SalesOrderId",
                table: "InventoryReservations");

            migrationBuilder.DropIndex(
                name: "IX_InventoryReservations_SalesOrderItemId",
                table: "InventoryReservations");

            migrationBuilder.DropColumn(
                name: "BillingAddress",
                table: "SalesOrders");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "SalesOrders");

            migrationBuilder.DropColumn(
                name: "DiscountAmount",
                table: "SalesOrders");

            migrationBuilder.DropColumn(
                name: "Remarks",
                table: "SalesOrders");

            migrationBuilder.DropColumn(
                name: "RequiredDeliveryDate",
                table: "SalesOrders");

            migrationBuilder.DropColumn(
                name: "ShippingAddress",
                table: "SalesOrders");

            migrationBuilder.DropColumn(
                name: "Subtotal",
                table: "SalesOrders");

            migrationBuilder.DropColumn(
                name: "TaxAmount",
                table: "SalesOrders");

            migrationBuilder.DropColumn(
                name: "Discount",
                table: "SalesOrderItems");

            migrationBuilder.DropColumn(
                name: "ReservedQuantity",
                table: "SalesOrderItems");

            migrationBuilder.DropColumn(
                name: "ShippedQuantity",
                table: "SalesOrderItems");

            migrationBuilder.DropColumn(
                name: "Tax",
                table: "SalesOrderItems");

            migrationBuilder.DropColumn(
                name: "Unit",
                table: "SalesOrderItems");

            migrationBuilder.DropColumn(
                name: "SalesOrderId",
                table: "InventoryReservations");

            migrationBuilder.DropColumn(
                name: "SalesOrderItemId",
                table: "InventoryReservations");

            migrationBuilder.AlterColumn<Guid>(
                name: "ProductionOrderRequirementId",
                table: "InventoryReservations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "ProductionOrderId",
                table: "InventoryReservations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
