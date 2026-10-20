using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAdvancedWarehouseTraceability : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ParentLocationId",
                table: "WarehouseLocations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "WarehouseLocations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TrackingMode",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "InventoryBatches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BatchNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseLocationId = table.Column<Guid>(type: "uuid", nullable: true),
                    ManufactureDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    QuantityOnHand = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    QuantityReserved = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    QuantityAvailable = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Barcode = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryBatches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InventoryBatches_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InventoryBatches_WarehouseLocations_WarehouseLocationId",
                        column: x => x.WarehouseLocationId,
                        principalTable: "WarehouseLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InventoryBatches_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InventorySerialNumbers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SerialNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseLocationId = table.Column<Guid>(type: "uuid", nullable: true),
                    BatchId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ReceivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IssuedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CurrentReferenceType = table.Column<int>(type: "integer", nullable: true),
                    CurrentReferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    Barcode = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventorySerialNumbers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InventorySerialNumbers_InventoryBatches_BatchId",
                        column: x => x.BatchId,
                        principalTable: "InventoryBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InventorySerialNumbers_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InventorySerialNumbers_WarehouseLocations_WarehouseLocation~",
                        column: x => x.WarehouseLocationId,
                        principalTable: "WarehouseLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InventorySerialNumbers_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WarehouseLocations_ParentLocationId",
                table: "WarehouseLocations",
                column: "ParentLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryBatches_ProductId_BatchNumber",
                table: "InventoryBatches",
                columns: new[] { "ProductId", "BatchNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InventoryBatches_WarehouseId",
                table: "InventoryBatches",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryBatches_WarehouseLocationId",
                table: "InventoryBatches",
                column: "WarehouseLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_InventorySerialNumbers_BatchId",
                table: "InventorySerialNumbers",
                column: "BatchId");

            migrationBuilder.CreateIndex(
                name: "IX_InventorySerialNumbers_ProductId",
                table: "InventorySerialNumbers",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_InventorySerialNumbers_SerialNumber",
                table: "InventorySerialNumbers",
                column: "SerialNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InventorySerialNumbers_WarehouseId",
                table: "InventorySerialNumbers",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_InventorySerialNumbers_WarehouseLocationId",
                table: "InventorySerialNumbers",
                column: "WarehouseLocationId");

            migrationBuilder.AddForeignKey(
                name: "FK_WarehouseLocations_WarehouseLocations_ParentLocationId",
                table: "WarehouseLocations",
                column: "ParentLocationId",
                principalTable: "WarehouseLocations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WarehouseLocations_WarehouseLocations_ParentLocationId",
                table: "WarehouseLocations");

            migrationBuilder.DropTable(
                name: "InventorySerialNumbers");

            migrationBuilder.DropTable(
                name: "InventoryBatches");

            migrationBuilder.DropIndex(
                name: "IX_WarehouseLocations_ParentLocationId",
                table: "WarehouseLocations");

            migrationBuilder.DropColumn(
                name: "ParentLocationId",
                table: "WarehouseLocations");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "WarehouseLocations");

            migrationBuilder.DropColumn(
                name: "TrackingMode",
                table: "Products");
        }
    }
}
