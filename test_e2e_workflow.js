import axios from 'axios';
import pg from 'pg';
const { Client } = pg;

const API_URL = 'http://localhost:5233/api';
const connectionString = "postgres://postgres:balan123@localhost:5432/NovaERPDB";

async function runE2E() {
    console.log("=== END-TO-END WORKFLOW AUDIT ===");
    const client = new Client({ connectionString });
    await client.connect();

    let api;
    let createdIds = {
        products: [], boms: [], plans: [], prs: [], pos: [], grs: [], productionOrders: [], executions: []
    };

    try {
        // 1. Auth
        console.log("1. Authenticating as Admin...");
        const loginRes = await axios.post(`${API_URL}/Auth/login`, {
            email: 'balashankar07@gmail.com', password: 'Admin@123'
        });
        api = axios.create({ headers: { Authorization: `Bearer ${loginRes.data.data.accessToken}` } });

        // 2a. Get Category, Unit, and Brand
        console.log("2a. Getting Category, Unit, and Brand...");
        const catRes = await api.get(`${API_URL}/ProductCategories?pageSize=1`);
        const categoryId = catRes.data.data.items[0].id;
        const unitRes = await api.get(`${API_URL}/Units?pageSize=1`);
        const unitId = unitRes.data.data.items[0].id;
        const brandRes = await api.get(`${API_URL}/Brands?pageSize=1`);
        const brandId = brandRes.data.data.items[0].id;

        const uniqueSuffix = Date.now();
        console.log("2b. Creating Component Product...");
        const compRes = await api.post(`${API_URL}/Products`, {
            categoryId, unitId, brandId, name: `Audit_Comp_${uniqueSuffix}`, productNumber: `C-AUD-${uniqueSuffix}`, productType: 2, isActive: true, costPrice: 10, sellingPrice: 15, minimumStock: 50, reorderLevel: 60, maximumStock: 500
        });
        const compId = compRes.data.data.id;
        createdIds.products.push(compId);

        // 3. Create Finished Good Product
        console.log("3. Creating Finished Good Product...");
        const fgRes = await api.post(`${API_URL}/Products`, {
            categoryId, unitId, name: `Audit_FG_${uniqueSuffix}`, productNumber: `F-AUD-${uniqueSuffix}`, productType: 1, isActive: true, costPrice: 0, sellingPrice: 100, minimumStock: 10, reorderLevel: 20, maximumStock: 100
        });
        const fgId = fgRes.data.data.id;
        createdIds.products.push(fgId);

        // 4. Create BOM
        console.log("4. Creating BOM...");
        const bomRes = await api.post(`${API_URL}/BOMs`, {
            productId: fgId, name: "Audit_BOM", revision: "1.0", isActive: true,
            items: [{ rawMaterialProductId: compId, quantity: 2, unitId: unitId, wastePercentage: 0 }]
        });
        const bomId = bomRes.data.data.id;
        createdIds.boms.push(bomId);

        // 5. Create Supplier Product Link (Needed for PO)
        console.log("5. Getting a Supplier and Linking Component...");
        const supplierRes = await api.get(`${API_URL}/Suppliers?pageSize=1`);
        const supplierId = supplierRes.data.data.items[0].id;
        await api.post(`${API_URL}/supplier-products`, {
            supplierId: supplierId, productId: compId, supplierSKU: "SUP-COMP-1", unitPrice: 9.5, moq: 10, leadTimeDays: 5, currency: "USD", isActive: true
        });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        // 6. Create Production Plan
        console.log("6. Creating Production Plan (Shortage Expected)...");
        const planRes = await api.post(`${API_URL}/ProductionPlans`, {
            planNumber: "PLN-AUDIT-1", name: "Audit Plan", targetDate: nextWeek.toISOString(), status: "Draft",
            productId: fgId, plannedQuantity: 100,
            requirements: [{ productId: compId, requiredQuantity: 200, allocatedQuantity: 0, shortageQuantity: 200 }]
        });
        const planId = planRes.data.data.id;
        createdIds.plans.push(planId);

        // 7. Create Purchase Request
        console.log("7. Creating PR from Shortage...");
        const prRes = await api.post(`${API_URL}/purchase-requests`, {
            requiredByDate: nextWeek.toISOString(),
            priority: 2,
            reason: "Audit PR",
            source: 1, // manual/MRP
            items: [{ productId: compId, requestedQuantity: 200 }]
        });
        const prId = prRes.data.data.id;
        createdIds.prs.push(prId);

        // Submit PR
        console.log("   Submitting PR...");
        await api.post(`${API_URL}/purchase-requests/${prId}/submit`);

        // Approve PR
        console.log("   Approving PR...");
        await api.post(`${API_URL}/purchase-requests/${prId}/approve`);

        // 8. Create Purchase Order
        console.log("8. Creating PO...");
        const poRes = await api.post(`${API_URL}/PurchaseOrders`, {
            supplierId: supplierId, orderDate: tomorrow.toISOString(), expectedDeliveryDate: nextWeek.toISOString(),
            status: "Draft",
            items: [{ productId: compId, quantity: 200, unitPrice: 9.5, purchaseRequestItemId: prRes.data.data.items[0].id }]
        });
        const poId = poRes.data.data.id;
        createdIds.pos.push(poId);
        const poItemId = poRes.data.data.items[0].id;

        // Submit and Approve PO
        console.log("   Submitting and Approving PO...");
        await api.post(`${API_URL}/PurchaseOrders/${poId}/submit`);
        await api.post(`${API_URL}/PurchaseOrders/${poId}/approve`);

        // 9. Goods Receipt -> Inventory
        console.log("9. Creating Goods Receipt...");
        const warehouseRes = await api.get(`${API_URL}/Warehouses?pageSize=1`);
        const warehouseId = warehouseRes.data.data.items[0].id;
        const grRes = await api.post(`${API_URL}/GoodsReceipts`, {
            purchaseOrderId: poId,
            warehouseId: warehouseId,
            remarks: "GR-AUDIT-1",
            items: [{ purchaseOrderItemId: poItemId, receivedQuantity: 200, rejectedQuantity: 0 }]
        });
        const grId = grRes.data.data.id;
        createdIds.grs.push(grId);

        // Receive GR
        console.log("   Receiving GR...");
        await api.post(`${API_URL}/GoodsReceipts/${grId}/receive`);

        // 10. Check Inventory
        console.log("10. Verifying Inventory...");
        const invRes = await api.get(`${API_URL}/Inventory/by-product/${compId}`);
        const inventory = invRes.data.data.find(i => i.warehouseId === warehouseId);
        if (inventory && inventory.quantityOnHand === 200) {
            console.log("[PASS] Inventory correctly updated to 200.");
        } else {
            console.log("[FAIL] Inventory not updated correctly.");
        }

        // 10.5 Release Production Plan
        console.log("10.5 Releasing Production Plan...");
        await api.post(`${API_URL}/ProductionPlans/${planId}/release`);

        // 11. Create Production Order
        console.log("11. Creating Production Order...");
        const prodOrderRes = await api.post(`${API_URL}/ProductionOrders`, {
            productionPlanId: planId, productId: fgId, orderNumber: "PRD-AUDIT-1",
            plannedQuantity: 100, startDate: tomorrow.toISOString(), expectedEndDate: nextWeek.toISOString(),
            priority: 2, remarks: "Audit Production Order"
        });
        const prodOrderId = prodOrderRes.data.data.id;
        createdIds.productionOrders.push(prodOrderId);

        // 12. Verify Frozen Requirements
        console.log("12. Verifying Frozen Requirements...");
        const prodOrderGetRes = await api.get(`${API_URL}/ProductionOrders/${prodOrderId}`);
        const requirements = prodOrderGetRes.data.data.materials;
        if (requirements && requirements.length > 0 && requirements[0].productId === compId) {
            console.log("[PASS] Frozen requirements correctly captured.");
        } else {
            console.log("[FAIL] Frozen requirements not captured correctly.");
        }

        // 13. Release Production Order
        console.log("13. Releasing Production Order (Triggers Reservation)...");
        await api.post(`${API_URL}/ProductionOrders/${prodOrderId}/release`);
        
        // 14. Check Inventory Reservation
        console.log("14. Verifying Inventory Reservation...");
        const postReleaseInvRes = await api.get(`${API_URL}/Inventory/by-product/${compId}`);
        const postReleaseInventory = postReleaseInvRes.data.data.find(i => i.warehouseId === warehouseId);
        // Required quantity was 200, so reserved should be 200
        if (postReleaseInventory && postReleaseInventory.quantityReserved === 200) {
            console.log("[PASS] Inventory reserved correctly. Available quantity updated.");
        } else {
            console.log(`[FAIL] Inventory not reserved correctly. Found reserved: ${postReleaseInventory ? postReleaseInventory.quantityReserved : 'N/A'}`);
        }

        console.log("15. Creating Production Execution...");
        const createExecRes = await api.post(`${API_URL}/ProductionExecutions`, {
            productionOrderId: createdIds.productionOrders[0],
            remarks: "E2E Execution Test"
        });
        const execution = createExecRes.data.data ? createExecRes.data.data : createExecRes.data;
        createdIds.executions = [execution.id]; // Track for cleanup

        console.log("16. Starting Execution...");
        await api.post(`${API_URL}/ProductionExecutions/${execution.id}/start`);

        console.log("17. Consuming Materials...");
        await api.post(`${API_URL}/ProductionExecutions/${execution.id}/consume`);

        console.log("18. Completing Execution...");
        await api.post(`${API_URL}/ProductionExecutions/${execution.id}/complete`, {
            producedQuantity: 10,
            rejectedQuantity: 0
        });

        
        console.log("19. Verifying Unused Reservation Release...");
        const activeRes = await client.query(`SELECT SUM("QuantityReserved" - "QuantityConsumed") as active FROM "InventoryReservations" WHERE "ProductionOrderId" = $1`, [createdIds.productionOrders[0]]);
        const activeRemaining = parseFloat(activeRes.rows[0].active || '0');
        if (activeRemaining > 0) throw new Error("Unused reservations were not released!");
        console.log("[PASS] Unused reservations released.");

        console.log("E2E WORKFLOW COMPLETED SUCCESSFULLY.");

    } catch (e) {
        if (e.response) {
            console.error("Test Failed with status:", e.response.status);
            console.error(JSON.stringify(e.response.data, null, 2));
        } else {
            console.error("Test Failed with error:", e);
        }
    } finally {
        // Cleanup
        console.log("\nCleaning up test records...");
        // Order of deletion matters to avoid FK constraints
        try {
            for (let id of createdIds.grs) await client.query(`DELETE FROM "GoodsReceiptItems" WHERE "GoodsReceiptId" = $1`, [id]);
            for (let id of createdIds.grs) await client.query(`DELETE FROM "GoodsReceipts" WHERE "Id" = $1`, [id]);
            for (let id of createdIds.executions) {
                await client.query(`DELETE FROM "MaterialConsumptions" WHERE "ProductionExecutionId" = $1`, [id]);
                await client.query(`DELETE FROM "ProductionExecutions" WHERE "Id" = $1`, [id]);
            }
            for (let id of createdIds.productionOrders) {
                await client.query(`DELETE FROM "InventoryReservations" WHERE "ProductionOrderId" = $1`, [id]);
                await client.query(`DELETE FROM "ProductionOrderRequirements" WHERE "ProductionOrderId" = $1`, [id]);
                await client.query(`DELETE FROM "ProductionOrders" WHERE "Id" = $1`, [id]);
            }
            for (let id of createdIds.pos) await client.query(`DELETE FROM "PurchaseOrderItems" WHERE "PurchaseOrderId" = $1`, [id]);
            for (let id of createdIds.pos) await client.query(`DELETE FROM "PurchaseOrders" WHERE "Id" = $1`, [id]);
            for (let id of createdIds.prs) await client.query(`DELETE FROM "PurchaseRequestItems" WHERE "PurchaseRequestId" = $1`, [id]);
            for (let id of createdIds.prs) await client.query(`DELETE FROM "PurchaseRequests" WHERE "Id" = $1`, [id]);
            for (let id of createdIds.plans) await client.query(`DELETE FROM "ProductionPlans" WHERE "Id" = $1`, [id]);
            for (let id of createdIds.boms) await client.query(`DELETE FROM "BOMItems" WHERE "BomId" = $1`, [id]);
            for (let id of createdIds.boms) await client.query(`DELETE FROM "BOMs" WHERE "Id" = $1`, [id]);
            await client.query(`DELETE FROM "SupplierProducts" WHERE "ProductId" = $1 OR "ProductId" = $2`, [createdIds.products[0], createdIds.products[1]]);
            for (let id of createdIds.products) {
                // We need to delete transactions by InventoryId, not ProductId, or just delete all for safety in tests
                await client.query(`DELETE FROM "InventoryTransactions" WHERE "InventoryId" IN (SELECT "Id" FROM "Inventories" WHERE "ProductId" = $1)`, [id]);
                await client.query(`DELETE FROM "Inventories" WHERE "ProductId" = $1`, [id]);
                await client.query(`DELETE FROM "Products" WHERE "Id" = $1`, [id]);
            }
            console.log("Cleanup complete.");
        } catch(err) {
            console.error("Cleanup error:", err);
        }
        await client.end();
    }
}

runE2E().catch(console.error);
