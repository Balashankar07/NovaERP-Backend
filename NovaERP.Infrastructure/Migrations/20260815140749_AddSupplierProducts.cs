using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSupplierProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE IF EXISTS ""PurchaseOrderItems"" ADD COLUMN IF NOT EXISTS ""SupplierUnitPrice"" numeric(18,2);

                CREATE TABLE IF NOT EXISTS ""SupplierProducts"" (
                    ""Id"" uuid NOT NULL,
                    ""SupplierId"" uuid NOT NULL,
                    ""ProductId"" uuid NOT NULL,
                    ""SupplierSKU"" character varying(100) NOT NULL,
                    ""UnitPrice"" numeric(18,2) NOT NULL,
                    ""MOQ"" numeric(18,2) NOT NULL,
                    ""LeadTimeDays"" integer NOT NULL,
                    ""Currency"" character varying(10) NOT NULL,
                    ""IsPreferred"" boolean NOT NULL,
                    ""IsActive"" boolean NOT NULL,
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    ""UpdatedAt"" timestamp with time zone NULL,
                    ""CreatedBy"" uuid NULL,
                    ""UpdatedBy"" uuid NULL,
                    CONSTRAINT ""PK_SupplierProducts"" PRIMARY KEY (""Id"")
                );

                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_SupplierProducts_Products_ProductId') THEN 
                        ALTER TABLE ""SupplierProducts"" ADD CONSTRAINT ""FK_SupplierProducts_Products_ProductId"" 
                            FOREIGN KEY (""ProductId"") REFERENCES ""Products"" (""Id"") ON DELETE RESTRICT; 
                    END IF; 
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_SupplierProducts_Suppliers_SupplierId') THEN 
                        ALTER TABLE ""SupplierProducts"" ADD CONSTRAINT ""FK_SupplierProducts_Suppliers_SupplierId"" 
                            FOREIGN KEY (""SupplierId"") REFERENCES ""Suppliers"" (""Id"") ON DELETE RESTRICT; 
                    END IF; 
                END $$;

                CREATE INDEX IF NOT EXISTS ""IX_SupplierProducts_IsActive"" ON ""SupplierProducts"" (""IsActive"");
                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_SupplierProducts_ProductId"" ON ""SupplierProducts"" (""ProductId"") WHERE ""IsActive"" = true AND ""IsPreferred"" = true;
                CREATE INDEX IF NOT EXISTS ""IX_SupplierProducts_SupplierId"" ON ""SupplierProducts"" (""SupplierId"");
                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_SupplierProducts_SupplierId_ProductId"" ON ""SupplierProducts"" (""SupplierId"", ""ProductId"") WHERE ""IsActive"" = true;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DROP TABLE IF EXISTS ""SupplierProducts"";
                ALTER TABLE IF EXISTS ""PurchaseOrderItems"" DROP COLUMN IF EXISTS ""SupplierUnitPrice"";
            ");
        }
    }
}
