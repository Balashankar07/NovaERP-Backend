const { Client } = require('pg');

const API_BASE = process.env.NOVAERP_API_BASE_URL || 'http://localhost:5233/api';
const DB_CONN = process.env.NOVAERP_DB_CONNECTION || 'postgresql://postgres:balan123@localhost:5432/NovaERPDB';

let token = '';

async function login() {
    const res = await fetch(`${API_BASE}/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'balashankar07@gmail.com', password: 'Admin@123' })
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    token = data.data.accessToken;
}

async function runTest() {
    console.log('=== PRODUCTION EXECUTION API TEST ===');
    const client = new Client({ connectionString: DB_CONN });
    await client.connect();

    // Snapshots for cleanup
    let executionId = null;
    let originalOrderStatus = null;
    let orderId = null;
    let fgProductId = null;
    let invBeforeSnapshot = [];
    let fgInvBeforeSnapshot = null;
    let resBeforeSnapshot = [];
    
    try {
        await login();
        console.log('1. Authenticated');

        // Find eligible Production Order
        const resOrders = await client.query(`
            SELECT po."Id" as "OrderId", po."ProductId", po."Status", po."PlannedQuantity"
            FROM "ProductionOrders" po
            JOIN "InventoryReservations" ir ON ir."ProductionOrderId" = po."Id"
            WHERE po."Status" IN (1, 2)
            LIMIT 1
        `);

        if (resOrders.rows.length === 0) {
            console.log('No eligible Production Orders found. You must run the master E2E test to generate test data first.');
            process.exit(1);
        }

        const order = resOrders.rows[0];
        orderId = order.OrderId;
        fgProductId = order.ProductId;
        originalOrderStatus = order.Status;
        console.log(`2. Found active Production Order: ${orderId}`);

        // Snapshot Inventory and Reservations
        const invBefore = await client.query(`
            SELECT "Id", "QuantityOnHand", "QuantityReserved" 
            FROM "Inventories" 
            WHERE "Id" IN (
                SELECT "InventoryId" FROM "InventoryReservations" WHERE "ProductionOrderId" = $1
            )
        `, [orderId]);
        invBeforeSnapshot = invBefore.rows;

        const resBefore = await client.query(`
            SELECT "Id", "QuantityReserved", "QuantityConsumed", "Status"
            FROM "InventoryReservations"
            WHERE "ProductionOrderId" = $1
        `, [orderId]);
        resBeforeSnapshot = resBefore.rows;
        
        const fgInvBefore = await client.query(`
            SELECT "Id", "QuantityOnHand" FROM "Inventories" WHERE "ProductId" = $1 LIMIT 1
        `, [fgProductId]);
        if(fgInvBefore.rows.length > 0) fgInvBeforeSnapshot = fgInvBefore.rows[0];

        // A. Create Execution
        const createRes = await fetch(`${API_BASE}/ProductionExecutions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                productionOrderId: orderId,
                remarks: 'Automated Test Execution'
            })
        });
        if (!createRes.ok) throw new Error(`Create failed: ${await createRes.text()}`);
        const execution = (await createRes.json()).data;
        executionId = execution.id;
        console.log(`3. Created Execution: ${executionId} (${execution.executionNumber})`);

        // B. Start Execution
        const startRes = await fetch(`${API_BASE}/ProductionExecutions/${executionId}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        if (!startRes.ok) throw new Error(`Start failed: ${await startRes.text()}`);
        console.log(`4. Started Execution successfully.`);

        // C. Consume Materials
        const consumeRes = await fetch(`${API_BASE}/ProductionExecutions/${executionId}/consume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        if (!consumeRes.ok) throw new Error(`Consume failed: ${await consumeRes.text()}`);
        console.log(`5. Consumed Materials successfully.`);

        // Verify Inventory and Reservation changes
        const invAfter = await client.query(`
            SELECT "Id", "QuantityOnHand", "QuantityReserved" 
            FROM "Inventories" 
            WHERE "Id" IN (
                SELECT "InventoryId" FROM "InventoryReservations" WHERE "ProductionOrderId" = $1
            )
        `, [orderId]);

        console.log(`6. Validating Inventory Invariants...`);
        for (let i = 0; i < invBeforeSnapshot.length; i++) {
            const before = invBeforeSnapshot[i];
            const after = invAfter.rows.find(r => r.Id === before.Id);
            if (!after) continue;
            
            if (parseFloat(after.QuantityOnHand) > parseFloat(before.QuantityOnHand)) {
                 throw new Error('OnHand increased during consumption!');
            }
            if (parseFloat(after.QuantityReserved) >= parseFloat(before.QuantityReserved)) {
                 throw new Error('Reserved did not decrease during consumption!');
            }
        }
        console.log('[PASS] Invariants maintained after consumption.');

        // D. Complete Execution
        const completeRes = await fetch(`${API_BASE}/ProductionExecutions/${executionId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                producedQuantity: 50,
                rejectedQuantity: 0
            })
        });
        if (!completeRes.ok) throw new Error(`Complete failed: ${await completeRes.text()}`);
        console.log(`7. Completed Execution successfully.`);

        // Verify FG Inventory
        const fgInvAfter = await client.query(`
            SELECT "QuantityOnHand" FROM "Inventories" WHERE "ProductId" = $1 LIMIT 1
        `, [fgProductId]);
        const fgOnHandAfter = fgInvAfter.rows.length > 0 ? parseFloat(fgInvAfter.rows[0].QuantityOnHand) : 0;
        const fgOnHandBeforeVal = fgInvBeforeSnapshot ? parseFloat(fgInvBeforeSnapshot.QuantityOnHand) : 0;

        if (fgOnHandAfter - fgOnHandBeforeVal !== 50) {
            throw new Error(`FG Inventory did not increase correctly. Expected +50, got ${fgOnHandAfter - fgOnHandBeforeVal}`);
        }
        console.log(`[PASS] FG Inventory verified.`);

        // Verify Unused Reservation Release
        const activeRes = await client.query(`
            SELECT SUM("QuantityReserved" - "QuantityConsumed") as active
            FROM "InventoryReservations"
            WHERE "ProductionOrderId" = $1
        `, [orderId]);
        
        const remainingActive = parseFloat(activeRes.rows[0].active || '0');
        if (remainingActive > 0) {
            throw new Error(`Architectural Gap detected: Unused reservations were not released! Remaining active: ${remainingActive}`);
        }
        console.log(`[PASS] Unused reservations successfully released.`);

        console.log('\nSUCCESS! Production Execution API functions perfectly.');

    } catch (err) {
        console.error('\nTEST FAILED:', err.message);
        process.exitCode = 1;
    } finally {
        console.log('\n--- Initiating Cleanup ---');
        try {
            if (executionId) {
                // Delete FG transactions
                await client.query(`DELETE FROM "InventoryTransactions" WHERE "ReferenceId" = $1`, [executionId]);
                // Revert FG inventory
                if (fgInvBeforeSnapshot) {
                    await client.query(`UPDATE "Inventories" SET "QuantityOnHand" = $1 WHERE "Id" = $2`, [fgInvBeforeSnapshot.QuantityOnHand, fgInvBeforeSnapshot.Id]);
                }
                
                // Delete consumptions
                await client.query(`DELETE FROM "MaterialConsumptions" WHERE "ProductionExecutionId" = $1`, [executionId]);
                // Delete execution
                await client.query(`DELETE FROM "ProductionExecutions" WHERE "Id" = $1`, [executionId]);
                
                console.log('Cleanup: Executions and Consumptions removed.');
            }
            if (orderId) {
                // Revert Inventories (raw materials)
                for (const inv of invBeforeSnapshot) {
                    await client.query(`UPDATE "Inventories" SET "QuantityOnHand" = $1, "QuantityReserved" = $2, "QuantityAvailable" = $1 - $2 WHERE "Id" = $3`, [inv.QuantityOnHand, inv.QuantityReserved, inv.Id]);
                }
                // Revert Reservations
                for (const res of resBeforeSnapshot) {
                    await client.query(`UPDATE "InventoryReservations" SET "QuantityReserved" = $1, "QuantityConsumed" = $2, "Status" = $3 WHERE "Id" = $4`, [res.QuantityReserved, res.QuantityConsumed, res.Status, res.Id]);
                }
                // Revert Order Status and quantities
                await client.query(`UPDATE "ProductionOrders" SET "Status" = $1, "StartedQuantity" = 0, "CompletedQuantity" = 0, "RejectedQuantity" = 0 WHERE "Id" = $2`, [originalOrderStatus, orderId]);
                console.log('Cleanup: Order, Inventory, and Reservations reverted.');
            }
        } catch (cleanupErr) {
            console.error('Cleanup failed:', cleanupErr.message);
        }
        
        await client.end();
        console.log('--- Cleanup Complete ---');
    }
}

runTest();
