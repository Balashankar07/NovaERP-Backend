using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPurchaseRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE IF EXISTS ""PurchaseOrderItems"" ADD COLUMN IF NOT EXISTS ""PurchaseRequestItemId"" uuid;

                CREATE TABLE IF NOT EXISTS ""PurchaseRequests"" (
                    ""Id"" uuid NOT NULL,
                    ""RequestNumber"" character varying(50) NOT NULL,
                    ""RequestedBy"" character varying(100) NOT NULL,
                    ""Department"" character varying(100) NOT NULL,
                    ""RequestDate"" timestamp with time zone NOT NULL,
                    ""RequiredByDate"" timestamp with time zone NOT NULL,
                    ""Priority"" integer NOT NULL,
                    ""Reason"" character varying(500) NOT NULL,
                    ""Status"" integer NOT NULL,
                    ""ApprovedBy"" character varying(100) NULL,
                    ""ApprovedAt"" timestamp with time zone NULL,
                    ""RejectionReason"" character varying(500) NULL,
                    ""Source"" integer NOT NULL,
                    ""SourceReferenceId"" uuid NULL,
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    ""UpdatedAt"" timestamp with time zone NULL,
                    ""CreatedBy"" uuid NULL,
                    ""UpdatedBy"" uuid NULL,
                    CONSTRAINT ""PK_PurchaseRequests"" PRIMARY KEY (""Id"")
                );

                CREATE TABLE IF NOT EXISTS ""PurchaseRequestItems"" (
                    ""Id"" uuid NOT NULL,
                    ""PurchaseRequestId"" uuid NOT NULL,
                    ""ProductId"" uuid NOT NULL,
                    ""RequestedQuantity"" numeric(18,2) NOT NULL,
                    ""ApprovedQuantity"" numeric(18,2) NOT NULL,
                    ""ConvertedQuantity"" numeric(18,2) NOT NULL,
                    ""Remarks"" character varying(500) NULL,
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    ""UpdatedAt"" timestamp with time zone NULL,
                    ""CreatedBy"" uuid NULL,
                    ""UpdatedBy"" uuid NULL,
                    CONSTRAINT ""PK_PurchaseRequestItems"" PRIMARY KEY (""Id"")
                );

                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_PurchaseRequestItems_Products_ProductId') THEN 
                        ALTER TABLE ""PurchaseRequestItems"" ADD CONSTRAINT ""FK_PurchaseRequestItems_Products_ProductId"" 
                            FOREIGN KEY (""ProductId"") REFERENCES ""Products"" (""Id"") ON DELETE RESTRICT; 
                    END IF; 
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_PurchaseRequestItems_PurchaseRequests_PurchaseRequestId') THEN 
                        ALTER TABLE ""PurchaseRequestItems"" ADD CONSTRAINT ""FK_PurchaseRequestItems_PurchaseRequests_PurchaseRequestId"" 
                            FOREIGN KEY (""PurchaseRequestId"") REFERENCES ""PurchaseRequests"" (""Id"") ON DELETE CASCADE; 
                    END IF; 
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_PurchaseOrderItems_PurchaseRequestItems_PurchaseRequestItem~') THEN 
                        ALTER TABLE ""PurchaseOrderItems"" ADD CONSTRAINT ""FK_PurchaseOrderItems_PurchaseRequestItems_PurchaseRequestItem~"" 
                            FOREIGN KEY (""PurchaseRequestItemId"") REFERENCES ""PurchaseRequestItems"" (""Id"") ON DELETE SET NULL; 
                    END IF; 
                END $$;

                CREATE INDEX IF NOT EXISTS ""IX_PurchaseOrderItems_PurchaseRequestItemId"" ON ""PurchaseOrderItems"" (""PurchaseRequestItemId"");
                CREATE INDEX IF NOT EXISTS ""IX_PurchaseRequestItems_ProductId"" ON ""PurchaseRequestItems"" (""ProductId"");
                CREATE INDEX IF NOT EXISTS ""IX_PurchaseRequestItems_PurchaseRequestId"" ON ""PurchaseRequestItems"" (""PurchaseRequestId"");
                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_PurchaseRequests_RequestNumber"" ON ""PurchaseRequests"" (""RequestNumber"");
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE IF EXISTS ""PurchaseOrderItems"" DROP CONSTRAINT IF EXISTS ""FK_PurchaseOrderItems_PurchaseRequestItems_PurchaseRequestItem~"";
                DROP TABLE IF EXISTS ""PurchaseRequestItems"";
                DROP TABLE IF EXISTS ""PurchaseRequests"";
                ALTER TABLE IF EXISTS ""PurchaseOrderItems"" DROP COLUMN IF EXISTS ""PurchaseRequestItemId"";
            ");
        }
    }
}
