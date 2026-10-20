using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReverseLogisticsDomain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CustomerReturns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReturnNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    SalesOrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    ShipmentId = table.Column<Guid>(type: "uuid", nullable: true),
                    WarrantyClaimId = table.Column<Guid>(type: "uuid", nullable: true),
                    Reason = table.Column<string>(type: "text", nullable: false),
                    RequestedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerReturns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerReturns_Distributors_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Distributors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CustomerReturns_SalesOrders_SalesOrderId",
                        column: x => x.SalesOrderId,
                        principalTable: "SalesOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CustomerReturns_ServiceRequests_WarrantyClaimId",
                        column: x => x.WarrantyClaimId,
                        principalTable: "ServiceRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CustomerReturns_Shipments_ShipmentId",
                        column: x => x.ShipmentId,
                        principalTable: "Shipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CustomerReturns_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "CustomerReturnItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerReturnId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    SerialNumber = table.Column<string>(type: "text", nullable: true),
                    BatchNumber = table.Column<string>(type: "text", nullable: true),
                    Reason = table.Column<string>(type: "text", nullable: false),
                    Condition = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerReturnItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerReturnItems_CustomerReturns_CustomerReturnId",
                        column: x => x.CustomerReturnId,
                        principalTable: "CustomerReturns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CustomerReturnItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReplacementOrders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReplacementNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CustomerReturnId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ReservationId = table.Column<Guid>(type: "uuid", nullable: true),
                    ShipmentId = table.Column<Guid>(type: "uuid", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReplacementOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReplacementOrders_CustomerReturns_CustomerReturnId",
                        column: x => x.CustomerReturnId,
                        principalTable: "CustomerReturns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReplacementOrders_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReplacementOrders_Shipments_ShipmentId",
                        column: x => x.ShipmentId,
                        principalTable: "Shipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ReplacementOrders_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReturnAuthorizations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RmaNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CustomerReturnId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorizedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    AuthorizationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    Instructions = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReturnAuthorizations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReturnAuthorizations_CustomerReturns_CustomerReturnId",
                        column: x => x.CustomerReturnId,
                        principalTable: "CustomerReturns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReturnAuthorizations_Users_AuthorizedByUserId",
                        column: x => x.AuthorizedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "CustomerRepairRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RepairNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CustomerReturnId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReturnAuthorizationId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    SerialNumber = table.Column<string>(type: "text", nullable: true),
                    AssignedEmployeeId = table.Column<Guid>(type: "uuid", nullable: true),
                    WorkCenterId = table.Column<Guid>(type: "uuid", nullable: true),
                    FaultDescription = table.Column<string>(type: "text", nullable: false),
                    RepairAction = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReinspectionId = table.Column<Guid>(type: "uuid", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerRepairRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerRepairRequests_CustomerReturns_CustomerReturnId",
                        column: x => x.CustomerReturnId,
                        principalTable: "CustomerReturns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CustomerRepairRequests_EmployeeProfiles_AssignedEmployeeId",
                        column: x => x.AssignedEmployeeId,
                        principalTable: "EmployeeProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CustomerRepairRequests_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CustomerRepairRequests_QualityInspections_ReinspectionId",
                        column: x => x.ReinspectionId,
                        principalTable: "QualityInspections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CustomerRepairRequests_ReturnAuthorizations_ReturnAuthoriza~",
                        column: x => x.ReturnAuthorizationId,
                        principalTable: "ReturnAuthorizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CustomerRepairRequests_WorkCenters_WorkCenterId",
                        column: x => x.WorkCenterId,
                        principalTable: "WorkCenters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ReturnReceipts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReceiptNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CustomerReturnId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReturnAuthorizationId = table.Column<Guid>(type: "uuid", nullable: true),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseLocationId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReceivedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReceivedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    SerialNumber = table.Column<string>(type: "text", nullable: true),
                    BatchNumber = table.Column<string>(type: "text", nullable: true),
                    Condition = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    QualityInspectionId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReturnReceipts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReturnReceipts_CustomerReturns_CustomerReturnId",
                        column: x => x.CustomerReturnId,
                        principalTable: "CustomerReturns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReturnReceipts_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReturnReceipts_QualityInspections_QualityInspectionId",
                        column: x => x.QualityInspectionId,
                        principalTable: "QualityInspections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ReturnReceipts_ReturnAuthorizations_ReturnAuthorizationId",
                        column: x => x.ReturnAuthorizationId,
                        principalTable: "ReturnAuthorizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ReturnReceipts_Users_ReceivedByUserId",
                        column: x => x.ReceivedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ReturnReceipts_WarehouseLocations_WarehouseLocationId",
                        column: x => x.WarehouseLocationId,
                        principalTable: "WarehouseLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ReturnReceipts_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReturnDispositions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DispositionNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CustomerReturnId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReturnReceiptId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    DispositionType = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: false),
                    ApprovedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ApprovedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExecutedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReturnDispositions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReturnDispositions_CustomerReturns_CustomerReturnId",
                        column: x => x.CustomerReturnId,
                        principalTable: "CustomerReturns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReturnDispositions_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReturnDispositions_ReturnReceipts_ReturnReceiptId",
                        column: x => x.ReturnReceiptId,
                        principalTable: "ReturnReceipts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReturnDispositions_Users_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerRepairRequests_AssignedEmployeeId",
                table: "CustomerRepairRequests",
                column: "AssignedEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerRepairRequests_CustomerReturnId",
                table: "CustomerRepairRequests",
                column: "CustomerReturnId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerRepairRequests_ProductId",
                table: "CustomerRepairRequests",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerRepairRequests_ReinspectionId",
                table: "CustomerRepairRequests",
                column: "ReinspectionId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerRepairRequests_RepairNumber",
                table: "CustomerRepairRequests",
                column: "RepairNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomerRepairRequests_ReturnAuthorizationId",
                table: "CustomerRepairRequests",
                column: "ReturnAuthorizationId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerRepairRequests_WorkCenterId",
                table: "CustomerRepairRequests",
                column: "WorkCenterId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerReturnItems_CustomerReturnId",
                table: "CustomerReturnItems",
                column: "CustomerReturnId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerReturnItems_ProductId",
                table: "CustomerReturnItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerReturns_CreatedByUserId",
                table: "CustomerReturns",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerReturns_CustomerId",
                table: "CustomerReturns",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerReturns_ReturnNumber",
                table: "CustomerReturns",
                column: "ReturnNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomerReturns_SalesOrderId",
                table: "CustomerReturns",
                column: "SalesOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerReturns_ShipmentId",
                table: "CustomerReturns",
                column: "ShipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerReturns_WarrantyClaimId",
                table: "CustomerReturns",
                column: "WarrantyClaimId");

            migrationBuilder.CreateIndex(
                name: "IX_ReplacementOrders_CustomerReturnId",
                table: "ReplacementOrders",
                column: "CustomerReturnId");

            migrationBuilder.CreateIndex(
                name: "IX_ReplacementOrders_ProductId",
                table: "ReplacementOrders",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ReplacementOrders_ReplacementNumber",
                table: "ReplacementOrders",
                column: "ReplacementNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReplacementOrders_ShipmentId",
                table: "ReplacementOrders",
                column: "ShipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ReplacementOrders_WarehouseId",
                table: "ReplacementOrders",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnAuthorizations_AuthorizedByUserId",
                table: "ReturnAuthorizations",
                column: "AuthorizedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnAuthorizations_CustomerReturnId",
                table: "ReturnAuthorizations",
                column: "CustomerReturnId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReturnAuthorizations_RmaNumber",
                table: "ReturnAuthorizations",
                column: "RmaNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReturnDispositions_ApprovedByUserId",
                table: "ReturnDispositions",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnDispositions_CustomerReturnId",
                table: "ReturnDispositions",
                column: "CustomerReturnId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnDispositions_DispositionNumber",
                table: "ReturnDispositions",
                column: "DispositionNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReturnDispositions_ProductId",
                table: "ReturnDispositions",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnDispositions_ReturnReceiptId",
                table: "ReturnDispositions",
                column: "ReturnReceiptId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnReceipts_CustomerReturnId",
                table: "ReturnReceipts",
                column: "CustomerReturnId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnReceipts_ProductId",
                table: "ReturnReceipts",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnReceipts_QualityInspectionId",
                table: "ReturnReceipts",
                column: "QualityInspectionId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnReceipts_ReceiptNumber",
                table: "ReturnReceipts",
                column: "ReceiptNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReturnReceipts_ReceivedByUserId",
                table: "ReturnReceipts",
                column: "ReceivedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnReceipts_ReturnAuthorizationId",
                table: "ReturnReceipts",
                column: "ReturnAuthorizationId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnReceipts_WarehouseId",
                table: "ReturnReceipts",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnReceipts_WarehouseLocationId",
                table: "ReturnReceipts",
                column: "WarehouseLocationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomerRepairRequests");

            migrationBuilder.DropTable(
                name: "CustomerReturnItems");

            migrationBuilder.DropTable(
                name: "ReplacementOrders");

            migrationBuilder.DropTable(
                name: "ReturnDispositions");

            migrationBuilder.DropTable(
                name: "ReturnReceipts");

            migrationBuilder.DropTable(
                name: "ReturnAuthorizations");

            migrationBuilder.DropTable(
                name: "CustomerReturns");
        }
    }
}
