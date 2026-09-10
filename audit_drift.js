const { Client } = require('pg');
const fs = require('fs');

const DB_CONNECTION = process.env.DATABASE_URL || "postgres://postgres:balan123@localhost:5432/NovaERPDB";

async function audit() {
    const client = new Client({ connectionString: DB_CONNECTION });
    await client.connect();

    try {
        console.log("Identifying drifted Inventories...");
        const driftQuery = `
            SELECT i."Id" as "InventoryId", i."ProductId", i."WarehouseId", i."WarehouseLocationId", 
                   i."QuantityOnHand", i."QuantityReserved", i."QuantityAvailable",
                   COALESCE(SUM(r."QuantityReserved"), 0) as "ActiveReservationAggregate",
                   i."QuantityReserved" - COALESCE(SUM(r."QuantityReserved"), 0) as "Difference"
            FROM "Inventories" i 
            LEFT JOIN "InventoryReservations" r ON i."Id" = r."InventoryId" AND r."Status" NOT IN (3, 4)
            GROUP BY i."Id", i."ProductId", i."WarehouseId", i."WarehouseLocationId", i."QuantityOnHand", i."QuantityReserved", i."QuantityAvailable"
            HAVING i."QuantityReserved" != COALESCE(SUM(r."QuantityReserved"), 0)
            ORDER BY i."Id" ASC
        `;
        const driftRes = await client.query(driftQuery);
        
        const report = {
            timestamp: new Date().toISOString(),
            totalDrifts: driftRes.rows.length,
            drifts: []
        };

        for (const row of driftRes.rows) {
            const inventoryId = row.InventoryId;
            
            const resQuery = `
                SELECT r."Id" as "ReservationId", r."ProductionOrderId", r."ProductionOrderRequirementId", 
                       r."ProductId", r."WarehouseId", r."WarehouseLocationId", 
                       r."QuantityReserved", r."QuantityConsumed", r."Status", r."CreatedAt", r."ReleasedAt"
                FROM "InventoryReservations" r
                WHERE r."InventoryId" = $1
            `;
            const resData = await client.query(resQuery, [inventoryId]);
            
            report.drifts.push({
                inventory: row,
                activeReservations: resData.rows
            });
        }
        
        const resCount = await client.query('SELECT COUNT(*) FROM "InventoryReservations"');
        const poCount = await client.query('SELECT COUNT(*) FROM "ProductionOrders"');
        console.log("Total Reservations:", resCount.rows[0].count);
        console.log("Total ProductionOrders:", poCount.rows[0].count);
        
        fs.writeFileSync('reservation_drift_report.json', JSON.stringify(report, null, 2));
        
        let txt = "==================================================\nNOVAERP RESERVATION DRIFT REPORT\n==================================================\n\n";
        txt += `Total Drifts Detected: ${report.totalDrifts}\n\n`;
        
        for (const d of report.drifts) {
            txt += `Inventory ID: ${d.inventory.InventoryId}\n`;
            txt += `  Product ID:  ${d.inventory.ProductId}\n`;
            txt += `  QuantityOnHand:    ${d.inventory.QuantityOnHand}\n`;
            txt += `  QuantityReserved:  ${d.inventory.QuantityReserved}  (DB Column)\n`;
            txt += `  ActiveAggregate:   ${d.inventory.ActiveReservationAggregate}  (Sum of Active Rows)\n`;
            txt += `  Difference:        ${d.inventory.Difference}\n\n`;
            
            if (d.activeReservations.length === 0) {
                txt += `  [No Active Reservations Found]\n`;
            } else {
                txt += `  Active Reservations:\n`;
                for (const r of d.activeReservations) {
                    txt += `    - ResID: ${r.ReservationId} | Order: ${r.ProductionOrderId} | QtyRes: ${r.QuantityReserved} | QtyCons: ${r.QuantityConsumed} | Status: ${r.Status}\n`;
                }
            }
            txt += `--------------------------------------------------\n`;
        }

        fs.writeFileSync('reservation_drift_report.txt', txt);
        console.log("Audit complete. Reports generated.");

    } catch (e) {
        console.error("Error during audit:", e);
    } finally {
        await client.end();
    }
}

audit();
