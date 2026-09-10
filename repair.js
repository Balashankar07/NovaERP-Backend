const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/NovaERPDB' });
    await client.connect();
    
    // Find orphaned reservations
    const findQ = `
        SELECT po."Id" as poid, ir."Id" as irid, ir."QuantityReserved", ir."QuantityConsumed"
        FROM "ProductionOrders" po
        JOIN "InventoryReservations" ir ON ir."ProductionOrderId" = po."Id"
        WHERE po."Status" IN (3, 4)
        AND ir."QuantityReserved" > ir."QuantityConsumed"
    `;
    const findRes = await client.query(findQ);
    console.log('Found:', findRes.rows);
    
    // Fix them
    const fixQ = `
        UPDATE "InventoryReservations"
        SET "QuantityReserved" = "QuantityConsumed", "Status" = 4
        WHERE "ProductionOrderId" IN (
            SELECT "Id" FROM "ProductionOrders" WHERE "Status" IN (3, 4)
        ) AND "QuantityReserved" > "QuantityConsumed"
    `;
    const fixRes = await client.query(fixQ);
    console.log('Fixed:', fixRes.rowCount);
    await client.end();
}
run().catch(console.error);
