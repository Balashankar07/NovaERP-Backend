using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakeQualityInspectionProductionExecutionNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QualityInspections_ProductionExecutions_ProductionExecution~",
                table: "QualityInspections");

            migrationBuilder.AlterColumn<Guid>(
                name: "ProductionExecutionId",
                table: "QualityInspections",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddForeignKey(
                name: "FK_QualityInspections_ProductionExecutions_ProductionExecution~",
                table: "QualityInspections",
                column: "ProductionExecutionId",
                principalTable: "ProductionExecutions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QualityInspections_ProductionExecutions_ProductionExecution~",
                table: "QualityInspections");

            migrationBuilder.AlterColumn<Guid>(
                name: "ProductionExecutionId",
                table: "QualityInspections",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_QualityInspections_ProductionExecutions_ProductionExecution~",
                table: "QualityInspections",
                column: "ProductionExecutionId",
                principalTable: "ProductionExecutions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
