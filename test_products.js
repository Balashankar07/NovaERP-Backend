const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:balan123@localhost:5432/NovaERPDB' });

async function run() {
    await client.connect();
    const res = await client.query(`
        SELECT "CreatedAt" 
        FROM "InventoryReservations" 
        ORDER BY "CreatedAt" DESC LIMIT 10
    `);
    console.log(res.rows);
    await client.end();
}
run();
