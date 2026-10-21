using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

using Microsoft.EntityFrameworkCore.Infrastructure;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260812123321_AddProductTypeAndConstraints")]
public partial class AddProductTypeAndConstraints : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            ALTER TABLE ""Products"" ADD COLUMN IF NOT EXISTS ""Type"" integer NOT NULL DEFAULT 0;
        ");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Manual rollback required if needed.
    }
}
