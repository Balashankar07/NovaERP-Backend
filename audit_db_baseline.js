import pg from 'pg';
const { Client } = pg;

const connectionString = "postgres://postgres:balan123@localhost:5432/NovaERPDB";

async function auditDB() {
    console.log("=== NOVAERP DATABASE BASELINE ===");
    const client = new Client({ connectionString });
    await client.connect();

    const tables = [
        'Users', 'Roles', 'Permissions', 'UserRoles', 'RolePermissions',
        'Products', 'BOMs', 'BOMItems', 'Suppliers', 'SupplierProducts',
        'PurchaseRequests', 'PurchaseRequestItems', 'PurchaseOrders', 'PurchaseOrderItems',
        'GoodsReceipts', 'GoodsReceiptItems', 'Inventories', 'Warehouses', 'WarehouseLocations',
        'InventoryTransactions', 'ProductionPlans', 'ProductionRequirements', 'ProductionOrders',
        'QualityInspections', 'SalesOrders', 'Shipments', 'Warranties'
    ];

    const results = {};

    for (const table of tables) {
        try {
            // Put table name in quotes to preserve case in pg if needed, but EF Core usually creates pluralized double-quoted tables or relies on default case.
            // Let's try standard quotes first.
            let res = await client.query(`SELECT COUNT(*) FROM "${table}"`);
            results[table] = parseInt(res.rows[0].count);
        } catch (e) {
            // Fallback for case sensitivity or non-existent tables
            try {
                let res = await client.query(`SELECT COUNT(*) FROM ${table}`);
                results[table] = parseInt(res.rows[0].count);
            } catch (e2) {
                results[table] = 'NOT IMPLEMENTED / MISSING TABLE';
            }
        }
    }

    console.table(results);
    
    // Check for negative inventory
    if (results['Inventories'] !== 'NOT IMPLEMENTED / MISSING TABLE') {
        const negInv = await client.query(`SELECT COUNT(*) FROM "Inventories" WHERE "QuantityOnHand" < 0 OR "QuantityAvailable" < 0`);
        console.log(`Negative Inventory Records: ${negInv.rows[0].count}`);
    }

    await client.end();
}

auditDB().catch(console.error);
