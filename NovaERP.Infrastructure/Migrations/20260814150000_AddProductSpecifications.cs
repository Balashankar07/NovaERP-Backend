using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

using Microsoft.EntityFrameworkCore.Infrastructure;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260814150000_AddProductSpecifications")]
public partial class AddProductSpecifications : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Add Specifications column (nullable varchar, up to 4000 chars for JSON specs)
        migrationBuilder.AddColumn<string>(
            name: "Specifications",
            table: "Products",
            type: "character varying(4000)",
            maxLength: 4000,
            nullable: true);

        // Fix the PRD-006 Wireless Headphone which has Type=0 (unknown) — set to 1 (FinishedGood)
        migrationBuilder.Sql(@"
            UPDATE ""Products""
            SET ""Type"" = 1
            WHERE ""ProductCode"" LIKE 'PRD-%' AND ""Type"" = 0;
        ");

        // Fix empty ProductNumber for PRD-006
        migrationBuilder.Sql(@"
            UPDATE ""Products""
            SET ""ProductNumber"" = 'PROD-0006'
            WHERE ""ProductCode"" = 'PRD-006' AND ""ProductNumber"" = '';
        ");

        // Ensure Nova Electronics brand exists (idempotent upsert)
        migrationBuilder.Sql(@"
            INSERT INTO ""Brands"" (""Id"", ""Name"", ""Description"", ""IsActive"", ""CreatedAt"", ""UpdatedAt"", ""CreatedBy"", ""UpdatedBy"")
            SELECT gen_random_uuid(), 'Nova Electronics', 'Nova Electronics — Consumer Electronics Manufacturer', TRUE, NOW(), NULL, NULL, NULL
            WHERE NOT EXISTS (SELECT 1 FROM ""Brands"" WHERE ""Name"" = 'Nova Electronics');
        ");

        // Update all PRD- FinishedGoods to use Nova Electronics brand
        migrationBuilder.Sql(@"
            UPDATE ""Products""
            SET ""BrandId"" = (SELECT ""Id"" FROM ""Brands"" WHERE ""Name"" = 'Nova Electronics' LIMIT 1)
            WHERE ""ProductCode"" LIKE 'PRD-%' AND ""Type"" = 1;
        ");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Specifications",
            table: "Products");
    }
}
