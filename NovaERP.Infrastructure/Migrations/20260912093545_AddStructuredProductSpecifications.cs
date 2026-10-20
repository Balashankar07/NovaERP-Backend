using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStructuredProductSpecifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.CreateTable(
                name: "ProductSpecification",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    AttributeName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Value = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductSpecification", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductSpecification_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductSpecification_ProductId",
                table: "ProductSpecification",
                column: "ProductId");

            migrationBuilder.Sql(@"
                INSERT INTO ""ProductSpecification"" (""Id"", ""ProductId"", ""AttributeName"", ""Value"", ""DisplayOrder"")
                SELECT 
                    gen_random_uuid(), 
                    ""Id"", 
                    'Legacy Specification', 
                    ""Specifications"", 
                    0
                FROM ""Products""
                WHERE ""Specifications"" IS NOT NULL AND ""Specifications"" != '';
            ");

            migrationBuilder.DropColumn(
                name: "Specifications",
                table: "Products");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductSpecification");

            migrationBuilder.AddColumn<string>(
                name: "Specifications",
                table: "Products",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);
        }
    }
}
