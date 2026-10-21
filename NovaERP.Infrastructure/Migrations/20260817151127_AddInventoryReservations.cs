using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryReservations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Note: xmin is a PostgreSQL system column and already exists implicitly on all tables.
            migrationBuilder.Sql(@"
                ALTER TABLE IF EXISTS ""GoodsReceipts"" ADD COLUMN IF NOT EXISTS ""WarehouseId"" uuid NULL;
                ALTER TABLE IF EXISTS ""GoodsReceipts"" ADD COLUMN IF NOT EXISTS ""WarehouseLocationId"" uuid NULL;

                CREATE TABLE IF NOT EXISTS ""ProductionOrderRequirements"" (
                    ""Id"" uuid NOT NULL,
                    ""ProductionOrderId"" uuid NOT NULL,
                    ""ProductId"" uuid NOT NULL,
                    ""UnitId"" uuid NULL,
                    ""RequiredQuantity"" numeric(18,2) NOT NULL,
                    ""ConsumedQuantity"" numeric(18,2) NOT NULL DEFAULT 0,
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    ""UpdatedAt"" timestamp with time zone NULL,
                    ""CreatedBy"" uuid NULL,
                    ""UpdatedBy"" uuid NULL,
                    CONSTRAINT ""PK_ProductionOrderRequirements"" PRIMARY KEY (""Id"")
                );

                CREATE TABLE IF NOT EXISTS ""InventoryReservations"" (
                    ""Id"" uuid NOT NULL,
                    ""ProductionOrderId"" uuid NOT NULL,
                    ""ProductionOrderRequirementId"" uuid NOT NULL,
                    ""InventoryId"" uuid NOT NULL,
                    ""ProductId"" uuid NOT NULL,
                    ""WarehouseId"" uuid NOT NULL,
                    ""WarehouseLocationId"" uuid NULL,
                    ""QuantityReserved"" numeric(18,2) NOT NULL,
                    ""QuantityConsumed"" numeric(18,2) NOT NULL DEFAULT 0,
                    ""Status"" integer NOT NULL,
                    ""ReleasedAt"" timestamp with time zone NULL,
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    ""UpdatedAt"" timestamp with time zone NULL,
                    ""CreatedBy"" uuid NULL,
                    ""UpdatedBy"" uuid NULL,
                    CONSTRAINT ""PK_InventoryReservations"" PRIMARY KEY (""Id"")
                );

                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductionOrderRequirements_ProductionOrders_ProductionOrde~') THEN 
                        ALTER TABLE ""ProductionOrderRequirements"" ADD CONSTRAINT ""FK_ProductionOrderRequirements_ProductionOrders_ProductionOrde~"" 
                            FOREIGN KEY (""ProductionOrderId"") REFERENCES ""ProductionOrders"" (""Id"") ON DELETE CASCADE; 
                    END IF; 
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductionOrderRequirements_Products_ProductId') THEN 
                        ALTER TABLE ""ProductionOrderRequirements"" ADD CONSTRAINT ""FK_ProductionOrderRequirements_Products_ProductId"" 
                            FOREIGN KEY (""ProductId"") REFERENCES ""Products"" (""Id"") ON DELETE RESTRICT; 
                    END IF; 
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductionOrderRequirements_Units_UnitId') THEN 
                        ALTER TABLE ""ProductionOrderRequirements"" ADD CONSTRAINT ""FK_ProductionOrderRequirements_Units_UnitId"" 
                            FOREIGN KEY (""UnitId"") REFERENCES ""Units"" (""Id"") ON DELETE SET NULL; 
                    END IF; 
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_InventoryReservations_Inventories_InventoryId') THEN 
                        ALTER TABLE ""InventoryReservations"" ADD CONSTRAINT ""FK_InventoryReservations_Inventories_InventoryId"" 
                            FOREIGN KEY (""InventoryId"") REFERENCES ""Inventories"" (""Id"") ON DELETE RESTRICT; 
                    END IF; 
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_InventoryReservations_ProductionOrderRequirements_Productio~') THEN 
                        ALTER TABLE ""InventoryReservations"" ADD CONSTRAINT ""FK_InventoryReservations_ProductionOrderRequirements_Productio~"" 
                            FOREIGN KEY (""ProductionOrderRequirementId"") REFERENCES ""ProductionOrderRequirements"" (""Id"") ON DELETE CASCADE; 
                    END IF; 
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_InventoryReservations_ProductionOrders_ProductionOrderId') THEN 
                        ALTER TABLE ""InventoryReservations"" ADD CONSTRAINT ""FK_InventoryReservations_ProductionOrders_ProductionOrderId"" 
                            FOREIGN KEY (""ProductionOrderId"") REFERENCES ""ProductionOrders"" (""Id"") ON DELETE CASCADE; 
                    END IF; 
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_InventoryReservations_Products_ProductId') THEN 
                        ALTER TABLE ""InventoryReservations"" ADD CONSTRAINT ""FK_InventoryReservations_Products_ProductId"" 
                            FOREIGN KEY (""ProductId"") REFERENCES ""Products"" (""Id"") ON DELETE RESTRICT; 
                    END IF; 
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_InventoryReservations_WarehouseLocations_WarehouseLocationId') THEN 
                        ALTER TABLE ""InventoryReservations"" ADD CONSTRAINT ""FK_InventoryReservations_WarehouseLocations_WarehouseLocationId"" 
                            FOREIGN KEY (""WarehouseLocationId"") REFERENCES ""WarehouseLocations"" (""Id"") ON DELETE SET NULL; 
                    END IF; 
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_InventoryReservations_Warehouses_WarehouseId') THEN 
                        ALTER TABLE ""InventoryReservations"" ADD CONSTRAINT ""FK_InventoryReservations_Warehouses_WarehouseId"" 
                            FOREIGN KEY (""WarehouseId"") REFERENCES ""Warehouses"" (""Id"") ON DELETE RESTRICT; 
                    END IF; 
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_GoodsReceipts_WarehouseLocations_WarehouseLocationId') THEN 
                        ALTER TABLE ""GoodsReceipts"" ADD CONSTRAINT ""FK_GoodsReceipts_WarehouseLocations_WarehouseLocationId"" 
                            FOREIGN KEY (""WarehouseLocationId"") REFERENCES ""WarehouseLocations"" (""Id"") ON DELETE SET NULL; 
                    END IF; 
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_GoodsReceipts_Warehouses_WarehouseId') THEN 
                        ALTER TABLE ""GoodsReceipts"" ADD CONSTRAINT ""FK_GoodsReceipts_Warehouses_WarehouseId"" 
                            FOREIGN KEY (""WarehouseId"") REFERENCES ""Warehouses"" (""Id"") ON DELETE SET NULL; 
                    END IF; 
                END $$;

                CREATE INDEX IF NOT EXISTS ""IX_GoodsReceipts_WarehouseId"" ON ""GoodsReceipts"" (""WarehouseId"");
                CREATE INDEX IF NOT EXISTS ""IX_GoodsReceipts_WarehouseLocationId"" ON ""GoodsReceipts"" (""WarehouseLocationId"");
                CREATE INDEX IF NOT EXISTS ""IX_InventoryReservations_InventoryId"" ON ""InventoryReservations"" (""InventoryId"");
                CREATE INDEX IF NOT EXISTS ""IX_InventoryReservations_ProductId"" ON ""InventoryReservations"" (""ProductId"");
                CREATE INDEX IF NOT EXISTS ""IX_InventoryReservations_ProductionOrderId"" ON ""InventoryReservations"" (""ProductionOrderId"");
                CREATE INDEX IF NOT EXISTS ""IX_InventoryReservations_ProductionOrderRequirementId"" ON ""InventoryReservations"" (""ProductionOrderRequirementId"");
                CREATE INDEX IF NOT EXISTS ""IX_InventoryReservations_WarehouseId"" ON ""InventoryReservations"" (""WarehouseId"");
                CREATE INDEX IF NOT EXISTS ""IX_InventoryReservations_WarehouseLocationId"" ON ""InventoryReservations"" (""WarehouseLocationId"");
                CREATE INDEX IF NOT EXISTS ""IX_ProductionOrderRequirements_ProductId"" ON ""ProductionOrderRequirements"" (""ProductId"");
                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_ProductionOrderRequirements_ProductionOrderId_ProductId"" ON ""ProductionOrderRequirements"" (""ProductionOrderId"", ""ProductId"");
                CREATE INDEX IF NOT EXISTS ""IX_ProductionOrderRequirements_UnitId"" ON ""ProductionOrderRequirements"" (""UnitId"");
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE IF EXISTS ""GoodsReceipts"" DROP CONSTRAINT IF EXISTS ""FK_GoodsReceipts_WarehouseLocations_WarehouseLocationId"";
                ALTER TABLE IF EXISTS ""GoodsReceipts"" DROP CONSTRAINT IF EXISTS ""FK_GoodsReceipts_Warehouses_WarehouseId"";
                DROP TABLE IF EXISTS ""InventoryReservations"";
                DROP TABLE IF EXISTS ""ProductionOrderRequirements"";
                ALTER TABLE IF EXISTS ""GoodsReceipts"" DROP COLUMN IF EXISTS ""WarehouseLocationId"";
                ALTER TABLE IF EXISTS ""GoodsReceipts"" DROP COLUMN IF EXISTS ""WarehouseId"";
            ");
        }
    }
}
