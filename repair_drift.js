const { Client } = require('pg');
const fs = require('fs');

const connectionString = process.env.DATABASE_URL || "postgres://postgres:balan123@localhost:5432/NovaERPDB";

// Phase 1 - 4: Reconstruction, Reconciliation, Validation, Protection
async function repairDrift() {
    const client = new Client({ connectionString });
    await client.connect();

    console.log("=== NOVAERP RESERVATION DRIFT REPAIR ===");

    try {
        // Find drifted inventories
        const invQuery = `
            SELECT i.* 
            FROM "Inventories" i
            WHERE i."QuantityReserved" > 0 
              AND NOT EXISTS (
                  SELECT 1 FROM "InventoryReservations" r 
                  WHERE r."InventoryId" = i."Id" 
                    AND r."Status" IN (1, 2)
              )
        `;
        const driftedInvs = (await client.query(invQuery)).rows;

        if (driftedInvs.length === 0) {
            console.log("No drifted inventories found. Idempotent check PASS.");
            await client.end();
            return;
        }

        console.log(`Found ${driftedInvs.length} drifted Inventories.`);

        // Phase 5: Backup
        console.log("Creating Backup...");
        const backup = {};
        backup.Inventories = driftedInvs;
        backup.InventoryReservations = (await client.query('SELECT * FROM "InventoryReservations"')).rows;
        backup.ProductionOrders = (await client.query('SELECT * FROM "ProductionOrders"')).rows;
        backup.ProductionOrderRequirements = (await client.query('SELECT * FROM "ProductionOrderRequirements"')).rows;
        backup.InventoryTransactions = (await client.query('SELECT * FROM "InventoryTransactions"')).rows;
        fs.writeFileSync('drift_backup.json', JSON.stringify(backup, null, 2));

        // Start Transaction
        await client.query('BEGIN');
        
        let allProposed = [];

        for (const inv of driftedInvs) {
            console.log(`\nReconstructing for Inventory: ${inv.Id} (Product: ${inv.ProductId})`);

            // Find relevant active PO Requirements for this product
            // ProductionOrderStatus: Draft = 0, Released = 1, InProgress = 2, Completed = 3, Cancelled = 4
            const reqQuery = `
                SELECT req."Id" as "RequirementId", req."ProductionOrderId", req."RequiredQuantity",
                       po."Status" as "POStatus"
                FROM "ProductionOrderRequirements" req
                JOIN "ProductionOrders" po ON req."ProductionOrderId" = po."Id"
                WHERE req."ProductId" = $1 AND po."Status" IN (1, 2)
            `;
            const activeReqs = (await client.query(reqQuery, [inv.ProductId])).rows;

            let proposedSum = 0;
            let proposedRows = [];

            for (const req of activeReqs) {
                // Determine exact required quantity
                const requiredQty = parseFloat(req.RequiredQuantity);

                // Determine actual consumed quantity from transactions for this specific PO
                // ReferenceType = 2 (ProductionExecution). Wait, InventoryTransactions reference the Execution, not the PO directly!
                // But wait, the transactions say: 'Consumed from reservation for Execution PE-20260817-BC52'
                // How to safely map it? The safest way is to find ProductionExecutions for this PO, then transactions for those executions.
                // Let's query ProductionExecutions for this PO
                const execQuery = `SELECT "Id" FROM "ProductionExecutions" WHERE "ProductionOrderId" = $1`;
                const execs = (await client.query(execQuery, [req.ProductionOrderId])).rows;
                const execIds = execs.map(e => e.Id);

                let consumedQty = 0;
                if (execIds.length > 0) {
                    const txQuery = `
                        SELECT SUM(ABS("Quantity")) as "Consumed"
                        FROM "InventoryTransactions"
                        WHERE "InventoryId" = $1 
                          AND "TransactionType" = 3 -- ProductionIssue
                          AND "ReferenceType" = 2 -- ProductionExecution
                          AND "ReferenceId" = ANY($2::uuid[])
                    `;
                    const txRes = await client.query(txQuery, [inv.Id, execIds]);
                    consumedQty = parseFloat(txRes.rows[0].Consumed || 0);
                }

                // If consumedQty >= requiredQty, it's fully consumed. We only recreate active/partially consumed ones.
                console.log(`Req: ${req.RequirementId} for PO: ${req.ProductionOrderId} - Required: ${requiredQty}, Consumed: ${consumedQty}`);
                if (consumedQty < requiredQty) {
                    const status = consumedQty > 0 ? 2 : 1; // 1 = Active, 2 = PartiallyConsumed
                    
                    const proposed = {
                        Id: null, // Will use gen_random_uuid() or uuidv4
                        ProductionOrderId: req.ProductionOrderId,
                        ProductionOrderRequirementId: req.RequirementId,
                        InventoryId: inv.Id,
                        ProductId: inv.ProductId,
                        WarehouseId: inv.WarehouseId,
                        WarehouseLocationId: inv.WarehouseLocationId,
                        QuantityReserved: requiredQty,
                        QuantityConsumed: consumedQty,
                        Status: status,
                        CreatedBy: null,
                        CreatedAt: new Date().toISOString()
                    };

                    proposedSum += (requiredQty - consumedQty);
                    proposedRows.push(proposed);
                }
            }

            // PHASE 2 - Exact Reconciliation
            const existingReserved = parseFloat(inv.QuantityReserved);
            console.log(`Expected (Inventory.QuantityReserved): ${existingReserved}`);
            console.log(`Proposed (Sum of Required - Consumed): ${proposedSum}`);

            if (Math.abs(existingReserved - proposedSum) > 0.001) {
                console.log(`[DISCREPANCY] Inventory ${inv.Id} has corrupted aggregate (${existingReserved} vs ${proposedSum}). Adjusting aggregate down to match exact reconstructed sum.`);
                const adjustmentQuery = `
                    UPDATE "Inventories"
                    SET "QuantityReserved" = $1,
                        "QuantityAvailable" = "QuantityOnHand" - $1
                    WHERE "Id" = $2
                `;
                await client.query(adjustmentQuery, [proposedSum, inv.Id]);
                console.log(`Inventory ${inv.Id} aggregate corrected to ${proposedSum}.`);
            }

            allProposed.push(...proposedRows);
        }

        // PHASE 3 & 6: Validate and Insert
        console.log(`\nReconciliation and Aggregate Correction PASS. Proceeding to insert ${allProposed.length} missing reservations...`);
        
        for (const r of allProposed) {
            // PHASE 4: Duplicate Protection
            const dupCheck = `
                SELECT 1 FROM "InventoryReservations" 
                WHERE "ProductionOrderRequirementId" = $1 AND "InventoryId" = $2
            `;
            const dup = await client.query(dupCheck, [r.ProductionOrderRequirementId, r.InventoryId]);
            if (dup.rows.length > 0) {
                console.error(`[DUPLICATE] Reservation already exists for Requirement ${r.ProductionOrderRequirementId}. Aborting.`);
                await client.query('ROLLBACK');
                await client.end();
                process.exit(1);
            }

            const insertQuery = `
                INSERT INTO "InventoryReservations" (
                    "Id", "ProductionOrderId", "ProductionOrderRequirementId", "InventoryId", "ProductId", 
                    "WarehouseId", "WarehouseLocationId", "QuantityReserved", "QuantityConsumed", "Status",
                    "CreatedAt"
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
                )
            `;
            await client.query(insertQuery, [
                r.ProductionOrderId, r.ProductionOrderRequirementId, r.InventoryId, r.ProductId,
                r.WarehouseId, r.WarehouseLocationId, r.QuantityReserved, r.QuantityConsumed, r.Status, r.CreatedAt
            ]);
        }

        // Verify Invariants Post-Insert
        console.log("Verifying invariants before COMMIT...");
        const postCheckQuery = `
            SELECT i."Id", i."QuantityReserved", 
                   COALESCE(SUM(r."QuantityReserved" - r."QuantityConsumed"), 0) as "ActiveAgg",
                   i."QuantityOnHand", i."QuantityAvailable"
            FROM "Inventories" i
            LEFT JOIN "InventoryReservations" r ON r."InventoryId" = i."Id" AND r."Status" IN (1, 2)
            WHERE i."QuantityReserved" > 0
            GROUP BY i."Id", i."QuantityReserved", i."QuantityOnHand", i."QuantityAvailable"
        `;
        const postChecks = (await client.query(postCheckQuery)).rows;
        
        for (const check of postChecks) {
            if (parseFloat(check.QuantityReserved) !== parseFloat(check.ActiveAgg)) {
                console.error(`[INVARIANT FAILURE] Inventory ${check.Id} QuantityReserved ${check.QuantityReserved} != ActiveAgg ${check.ActiveAgg}. Aborting.`);
                await client.query('ROLLBACK');
                await client.end();
                process.exit(1);
            }
            if (parseFloat(check.QuantityAvailable) !== parseFloat(check.QuantityOnHand) - parseFloat(check.QuantityReserved)) {
                 console.error(`[INVARIANT FAILURE] Inventory ${check.Id} QuantityAvailable != QuantityOnHand - QuantityReserved. Aborting.`);
                 await client.query('ROLLBACK');
                 await client.end();
                 process.exit(1);
            }
            if (parseFloat(check.QuantityReserved) > parseFloat(check.QuantityOnHand)) {
                 console.error(`[INVARIANT FAILURE] Inventory ${check.Id} QuantityReserved > QuantityOnHand. Aborting.`);
                 await client.query('ROLLBACK');
                 await client.end();
                 process.exit(1);
            }
        }

        await client.query('COMMIT');
        console.log("All invariants passed. COMMIT SUCCESSFUL.");

    } catch (e) {
        console.error("Error during repair. Triggering ROLLBACK.", e);
        await client.query('ROLLBACK');
    } finally {
        await client.end();
    }
}

repairDrift().catch(console.error);
