const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:balan123@localhost:5432/NovaERPDB' });

async function run() {
    await client.connect();
    
    console.log("=== BACKING UP RECORDS ===");
    // Write backup to a file
    const fs = require('fs');
    const backup = {};
    backup.Inventories = (await client.query('SELECT * FROM "Inventories" WHERE "QuantityReserved" > 0')).rows;
    backup.InventoryReservations = (await client.query('SELECT * FROM "InventoryReservations"')).rows;
    backup.ProductionOrders = (await client.query('SELECT * FROM "ProductionOrders"')).rows;
    backup.ProductionOrderRequirements = (await client.query('SELECT * FROM "ProductionOrderRequirements"')).rows;
    backup.InventoryTransactions = (await client.query('SELECT * FROM "InventoryTransactions"')).rows;
    
    fs.writeFileSync('drift_backup.json', JSON.stringify(backup, null, 2));
    console.log("Backup saved to drift_backup.json");
    
    await client.end();
}
run();
