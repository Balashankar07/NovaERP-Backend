const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgres://postgres:balan123@localhost:5432/NovaERPDB' });
    await client.connect();
    
    // Find drifted inventories
    const findQ = `
        SELECT i."Id", i."QuantityReserved", COALESCE(SUM(r."QuantityReserved" - r."QuantityConsumed"), 0) as "Aggregated"
        FROM "Inventories" i 
        LEFT JOIN "InventoryReservations" r ON i."Id" = r."InventoryId" AND r."Status" NOT IN (3, 4)
        GROUP BY i."Id", i."QuantityReserved" 
        HAVING i."QuantityReserved" != COALESCE(SUM(r."QuantityReserved" - r."QuantityConsumed"), 0)
    `;
    const findRes = await client.query(findQ);
    console.log('Found drifted:', findRes.rows);
    
    // Fix them
    for (const row of findRes.rows) {
        const fixQ = `
            UPDATE "Inventories"
            SET "QuantityReserved" = $1, "QuantityAvailable" = "QuantityOnHand" - $1
            WHERE "Id" = $2
        `;
        await client.query(fixQ, [row.Aggregated, row.Id]);
    }
    console.log('Fixed:', findRes.rowCount);
    await client.end();
}
run().catch(console.error);
