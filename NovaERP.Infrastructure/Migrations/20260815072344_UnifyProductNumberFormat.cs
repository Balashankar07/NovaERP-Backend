using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UnifyProductNumberFormat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DO $$
DECLARE
    rec RECORD;
    next_num INT := 6;
BEGIN
    FOR rec IN 
        SELECT ""Id"" FROM ""Products"" 
        WHERE ""Type"" = 2
        ORDER BY ""ProductCode""
    LOOP
        UPDATE ""Products"" 
        SET ""ProductNumber"" = 'PROD-' || LPAD(next_num::TEXT, 4, '0')
        WHERE ""Id"" = rec.""Id"";
        
        next_num := next_num + 1;
    END LOOP;

    PERFORM setval('""ProductNumberSeq""', 38, true);
END $$;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
