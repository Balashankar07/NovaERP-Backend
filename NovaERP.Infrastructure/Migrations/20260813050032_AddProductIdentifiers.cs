using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

using Microsoft.EntityFrameworkCore.Infrastructure;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260813050032_AddProductIdentifiers")]
public partial class AddProductIdentifiers : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Already applied directly to the database. No action required.
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Manual rollback required if needed.
    }
}
