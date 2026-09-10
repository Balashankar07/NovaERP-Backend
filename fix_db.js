const { Client } = require('pg'); 
const client = new Client({ connectionString: 'postgres://postgres:balan123@localhost:5432/NovaERPDB' }); 

async function run() { 
    await client.connect(); 
    const res = await client.query('SELECT i."Id", i."QuantityOnHand", i."QuantityReserved", COALESCE(SUM(r."QuantityReserved" - r."QuantityConsumed"), 0) as "Aggregated" FROM "Inventories" i LEFT JOIN "InventoryReservations" r ON i."Id" = r."InventoryId" AND r."Status" NOT IN (3, 4) GROUP BY i."Id", i."QuantityOnHand", i."QuantityReserved" HAVING i."QuantityReserved" != COALESCE(SUM(r."QuantityReserved" - r."QuantityConsumed"), 0)'); 
    console.log(res.rows); 
    for (let r of res.rows) { 
        const newReserved = parseFloat(r.Aggregated);
        const onHand = parseFloat(r.QuantityOnHand);
        const newAvailable = onHand - newReserved;
        await client.query('UPDATE "Inventories" SET "QuantityReserved" = $1, "QuantityAvailable" = $2 WHERE "Id" = $3', [newReserved, newAvailable, r.Id]); 
        console.log('Fixed', r.Id); 
    } 
    await client.end(); 
} 
run();
