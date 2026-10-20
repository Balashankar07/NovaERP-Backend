using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAdvancedQualityCompliance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NonConformanceReports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NcrNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    QualityInspectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductionExecutionId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    BatchId = table.Column<Guid>(type: "uuid", nullable: true),
                    SerialNumberId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReportedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedToUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Severity = table.Column<int>(type: "integer", nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    DetectedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ContainmentAction = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    RootCauseCategory = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    RootCauseDescription = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CorrectiveAction = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    PreventiveAction = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ClosedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ClosureRemarks = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NonConformanceReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NonConformanceReports_InventoryBatches_BatchId",
                        column: x => x.BatchId,
                        principalTable: "InventoryBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NonConformanceReports_InventorySerialNumbers_SerialNumberId",
                        column: x => x.SerialNumberId,
                        principalTable: "InventorySerialNumbers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NonConformanceReports_ProductionExecutions_ProductionExecut~",
                        column: x => x.ProductionExecutionId,
                        principalTable: "ProductionExecutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NonConformanceReports_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NonConformanceReports_QualityInspections_QualityInspectionId",
                        column: x => x.QualityInspectionId,
                        principalTable: "QualityInspections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NonConformanceReports_Users_AssignedToUserId",
                        column: x => x.AssignedToUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NonConformanceReports_Users_ReportedByUserId",
                        column: x => x.ReportedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CAPAs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CapaNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NcrId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    RootCause = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ContainmentAction = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CorrectiveAction = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    PreventiveAction = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    OwnerEmployeeId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    VerificationNotes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CAPAs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CAPAs_EmployeeProfiles_OwnerEmployeeId",
                        column: x => x.OwnerEmployeeId,
                        principalTable: "EmployeeProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CAPAs_NonConformanceReports_NcrId",
                        column: x => x.NcrId,
                        principalTable: "NonConformanceReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "QualityDispositions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DispositionNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    QualityInspectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    NcrId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseLocationId = table.Column<Guid>(type: "uuid", nullable: true),
                    BatchId = table.Column<Guid>(type: "uuid", nullable: true),
                    SerialNumberId = table.Column<Guid>(type: "uuid", nullable: true),
                    DispositionType = table.Column<int>(type: "integer", nullable: false),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ApprovedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ApprovedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QualityDispositions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QualityDispositions_InventoryBatches_BatchId",
                        column: x => x.BatchId,
                        principalTable: "InventoryBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QualityDispositions_InventorySerialNumbers_SerialNumberId",
                        column: x => x.SerialNumberId,
                        principalTable: "InventorySerialNumbers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QualityDispositions_NonConformanceReports_NcrId",
                        column: x => x.NcrId,
                        principalTable: "NonConformanceReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QualityDispositions_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QualityDispositions_QualityInspections_QualityInspectionId",
                        column: x => x.QualityInspectionId,
                        principalTable: "QualityInspections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QualityDispositions_Users_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QualityDispositions_WarehouseLocations_WarehouseLocationId",
                        column: x => x.WarehouseLocationId,
                        principalTable: "WarehouseLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QualityDispositions_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReworkRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReworkNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    QualityInspectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    NcrId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProductionExecutionId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    AssignedWorkCenterId = table.Column<Guid>(type: "uuid", nullable: true),
                    AssignedEmployeeId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Remarks = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ApprovedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReworkRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReworkRequests_EmployeeProfiles_AssignedEmployeeId",
                        column: x => x.AssignedEmployeeId,
                        principalTable: "EmployeeProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReworkRequests_NonConformanceReports_NcrId",
                        column: x => x.NcrId,
                        principalTable: "NonConformanceReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReworkRequests_ProductionExecutions_ProductionExecutionId",
                        column: x => x.ProductionExecutionId,
                        principalTable: "ProductionExecutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReworkRequests_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReworkRequests_QualityInspections_QualityInspectionId",
                        column: x => x.QualityInspectionId,
                        principalTable: "QualityInspections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReworkRequests_Users_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReworkRequests_WorkCenters_AssignedWorkCenterId",
                        column: x => x.AssignedWorkCenterId,
                        principalTable: "WorkCenters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ScrapRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ScrapNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    QualityInspectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    NcrId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    BatchId = table.Column<Guid>(type: "uuid", nullable: true),
                    SerialNumberId = table.Column<Guid>(type: "uuid", nullable: true),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseLocationId = table.Column<Guid>(type: "uuid", nullable: true),
                    Quantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ApprovedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ScrapDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Remarks = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScrapRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScrapRecords_InventoryBatches_BatchId",
                        column: x => x.BatchId,
                        principalTable: "InventoryBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ScrapRecords_InventorySerialNumbers_SerialNumberId",
                        column: x => x.SerialNumberId,
                        principalTable: "InventorySerialNumbers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ScrapRecords_NonConformanceReports_NcrId",
                        column: x => x.NcrId,
                        principalTable: "NonConformanceReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ScrapRecords_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ScrapRecords_QualityInspections_QualityInspectionId",
                        column: x => x.QualityInspectionId,
                        principalTable: "QualityInspections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ScrapRecords_Users_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ScrapRecords_WarehouseLocations_WarehouseLocationId",
                        column: x => x.WarehouseLocationId,
                        principalTable: "WarehouseLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ScrapRecords_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CAPAs_CapaNumber",
                table: "CAPAs",
                column: "CapaNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CAPAs_NcrId",
                table: "CAPAs",
                column: "NcrId");

            migrationBuilder.CreateIndex(
                name: "IX_CAPAs_OwnerEmployeeId",
                table: "CAPAs",
                column: "OwnerEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_NonConformanceReports_AssignedToUserId",
                table: "NonConformanceReports",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_NonConformanceReports_BatchId",
                table: "NonConformanceReports",
                column: "BatchId");

            migrationBuilder.CreateIndex(
                name: "IX_NonConformanceReports_NcrNumber",
                table: "NonConformanceReports",
                column: "NcrNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NonConformanceReports_ProductId",
                table: "NonConformanceReports",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_NonConformanceReports_ProductionExecutionId",
                table: "NonConformanceReports",
                column: "ProductionExecutionId");

            migrationBuilder.CreateIndex(
                name: "IX_NonConformanceReports_QualityInspectionId",
                table: "NonConformanceReports",
                column: "QualityInspectionId");

            migrationBuilder.CreateIndex(
                name: "IX_NonConformanceReports_ReportedByUserId",
                table: "NonConformanceReports",
                column: "ReportedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_NonConformanceReports_SerialNumberId",
                table: "NonConformanceReports",
                column: "SerialNumberId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityDispositions_ApprovedByUserId",
                table: "QualityDispositions",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityDispositions_BatchId",
                table: "QualityDispositions",
                column: "BatchId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityDispositions_DispositionNumber",
                table: "QualityDispositions",
                column: "DispositionNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QualityDispositions_NcrId",
                table: "QualityDispositions",
                column: "NcrId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityDispositions_ProductId",
                table: "QualityDispositions",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityDispositions_QualityInspectionId",
                table: "QualityDispositions",
                column: "QualityInspectionId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityDispositions_SerialNumberId",
                table: "QualityDispositions",
                column: "SerialNumberId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityDispositions_WarehouseId",
                table: "QualityDispositions",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityDispositions_WarehouseLocationId",
                table: "QualityDispositions",
                column: "WarehouseLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_ReworkRequests_ApprovedByUserId",
                table: "ReworkRequests",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReworkRequests_AssignedEmployeeId",
                table: "ReworkRequests",
                column: "AssignedEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_ReworkRequests_AssignedWorkCenterId",
                table: "ReworkRequests",
                column: "AssignedWorkCenterId");

            migrationBuilder.CreateIndex(
                name: "IX_ReworkRequests_NcrId",
                table: "ReworkRequests",
                column: "NcrId");

            migrationBuilder.CreateIndex(
                name: "IX_ReworkRequests_ProductId",
                table: "ReworkRequests",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ReworkRequests_ProductionExecutionId",
                table: "ReworkRequests",
                column: "ProductionExecutionId");

            migrationBuilder.CreateIndex(
                name: "IX_ReworkRequests_QualityInspectionId",
                table: "ReworkRequests",
                column: "QualityInspectionId");

            migrationBuilder.CreateIndex(
                name: "IX_ReworkRequests_ReworkNumber",
                table: "ReworkRequests",
                column: "ReworkNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScrapRecords_ApprovedByUserId",
                table: "ScrapRecords",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ScrapRecords_BatchId",
                table: "ScrapRecords",
                column: "BatchId");

            migrationBuilder.CreateIndex(
                name: "IX_ScrapRecords_NcrId",
                table: "ScrapRecords",
                column: "NcrId");

            migrationBuilder.CreateIndex(
                name: "IX_ScrapRecords_ProductId",
                table: "ScrapRecords",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ScrapRecords_QualityInspectionId",
                table: "ScrapRecords",
                column: "QualityInspectionId");

            migrationBuilder.CreateIndex(
                name: "IX_ScrapRecords_ScrapNumber",
                table: "ScrapRecords",
                column: "ScrapNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScrapRecords_SerialNumberId",
                table: "ScrapRecords",
                column: "SerialNumberId");

            migrationBuilder.CreateIndex(
                name: "IX_ScrapRecords_WarehouseId",
                table: "ScrapRecords",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_ScrapRecords_WarehouseLocationId",
                table: "ScrapRecords",
                column: "WarehouseLocationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CAPAs");

            migrationBuilder.DropTable(
                name: "QualityDispositions");

            migrationBuilder.DropTable(
                name: "ReworkRequests");

            migrationBuilder.DropTable(
                name: "ScrapRecords");

            migrationBuilder.DropTable(
                name: "NonConformanceReports");
        }
    }
}
