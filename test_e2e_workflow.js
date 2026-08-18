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
        products: [], boms: [], prs: [], pos: [], grs: [], plans: []
    };

    try {
        // 1. Auth
        console.log("1. Authenticating as Admin...");
        const loginRes = await axios.post(`${API_URL}/Auth/login`, {
            email: 'balashankar07@gmail.com', password: 'Admin@123'
        });
        api = axios.create({ headers: { Authorization: `Bearer ${loginRes.data.data.accessToken}` } });

        // 2. Create Component Product
        console.log("2. Creating Component Product...");
        const compRes = await api.post(`${API_URL}/Products`, {
            name: "Audit_Comp_1", productNumber: "COMP-AUDIT-1", productType: 2, isActive: true, costPrice: 10, sellingPrice: 0, minimumStock: 50, reorderLevel: 60, maximumStock: 500
        });
        const compId = compRes.data.data.id;
        createdIds.products.push(compId);

        // 3. Create Finished Good Product
        console.log("3. Creating Finished Good Product...");
        const fgRes = await api.post(`${API_URL}/Products`, {
            name: "Audit_FG_1", productNumber: "FG-AUDIT-1", productType: 1, isActive: true, costPrice: 0, sellingPrice: 100, minimumStock: 10, reorderLevel: 20, maximumStock: 100
        });
        const fgId = fgRes.data.data.id;
        createdIds.products.push(fgId);

        // 4. Create BOM
        console.log("4. Creating BOM...");
        const bomRes = await api.post(`${API_URL}/BOMs`, {
            productId: fgId, name: "Audit_BOM", revision: "1.0", isActive: true,
            items: [{ componentId: compId, quantity: 2, unitOfMeasure: "pcs" }]
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

        // 6. Create Production Plan
        console.log("6. Creating Production Plan (Shortage Expected)...");
        const planRes = await api.post(`${API_URL}/ProductionPlans`, {
            planNumber: "PLN-AUDIT-1", name: "Audit Plan", targetDate: new Date().toISOString(), status: "Draft",
            productId: fgId, plannedQuantity: 100,
            requirements: [{ productId: compId, requiredQuantity: 200, allocatedQuantity: 0, shortageQuantity: 200 }]
        });
        const planId = planRes.data.data.id;
        createdIds.plans.push(planId);

        // 7. Create Purchase Request
        console.log("7. Creating PR from Shortage...");
        const prRes = await api.post(`${API_URL}/purchase-requests`, {
            requestNumber: "PR-AUDIT-1", requestDate: new Date().toISOString(), requiredDate: new Date().toISOString(),
            status: "Draft", priority: "High", requestingDepartmentId: "00000000-0000-0000-0000-000000000000",
            notes: "Audit PR",
            items: [{ productId: compId, requestedQuantity: 200 }]
        });
        const prId = prRes.data.data.id;
        createdIds.prs.push(prId);

        // Approve PR
        console.log("   Approving PR...");
        await api.put(`${API_URL}/purchase-requests/${prId}/approve`, {
            items: [{ purchaseRequestItemId: prRes.data.data.items[0].id, approvedQuantity: 200 }]
        });

        // 8. Create Purchase Order
        console.log("8. Creating PO...");
        const poRes = await api.post(`${API_URL}/purchase-orders`, {
            supplierId: supplierId, orderDate: new Date().toISOString(), expectedDeliveryDate: new Date().toISOString(),
            status: "Draft",
            items: [{ productId: compId, quantity: 200, unitPrice: 9.5, purchaseRequestItemId: prRes.data.data.items[0].id }]
        });
        const poId = poRes.data.data.id;
        createdIds.pos.push(poId);
        const poItemId = poRes.data.data.items[0].id;

        // Approve PO
        console.log("   Approving PO...");
        await api.put(`${API_URL}/purchase-orders/${poId}/status`, "PendingReceipt", { headers: { "Content-Type": "application/json" }});

        // 9. Goods Receipt -> Inventory
        console.log("9. Creating Goods Receipt...");
        const warehouseRes = await api.get(`${API_URL}/Warehouses?pageSize=1`);
        const warehouseId = warehouseRes.data.data.items[0].id;
        const grRes = await api.post(`${API_URL}/purchase-orders/${poId}/receive`, {
            receiptDate: new Date().toISOString(), referenceDocument: "GR-AUDIT-1", warehouseId: warehouseId,
            items: [{ purchaseOrderItemId: poItemId, receivedQuantity: 200, acceptedQuantity: 200, rejectedQuantity: 0, locationId: null }]
        });
        const grId = grRes.data.data.id;
        createdIds.grs.push(grId);

        // 10. Check Inventory
        console.log("10. Verifying Inventory...");
        const invRes = await api.get(`${API_URL}/Inventory/by-product/${compId}`);
        const inventory = invRes.data.data.find(i => i.warehouseId === warehouseId);
        if (inventory && inventory.quantityOnHand === 200) {
            console.log("[PASS] Inventory correctly updated to 200.");
        } else {
            console.log("[FAIL] Inventory not updated correctly.");
        }

        console.log("E2E WORKFLOW COMPLETED SUCCESSFULLY.");

    } catch (e) {
        console.error("Test Failed:", e.response ? e.response.data : e.message);
    } finally {
        // Cleanup
        console.log("\nCleaning up test records...");
        // Order of deletion matters to avoid FK constraints
        try {
            for (let id of createdIds.grs) await client.query(`DELETE FROM "GoodsReceipts" WHERE "Id" = $1`, [id]);
            for (let id of createdIds.pos) await client.query(`DELETE FROM "PurchaseOrders" WHERE "Id" = $1`, [id]);
            for (let id of createdIds.prs) await client.query(`DELETE FROM "PurchaseRequests" WHERE "Id" = $1`, [id]);
            for (let id of createdIds.plans) await client.query(`DELETE FROM "ProductionPlans" WHERE "Id" = $1`, [id]);
            for (let id of createdIds.boms) await client.query(`DELETE FROM "BOMs" WHERE "Id" = $1`, [id]);
            await client.query(`DELETE FROM "SupplierProducts" WHERE "ProductId" = $1 OR "ProductId" = $2`, [createdIds.products[0], createdIds.products[1]]);
            for (let id of createdIds.products) {
                await client.query(`DELETE FROM "Inventories" WHERE "ProductId" = $1`, [id]);
                await client.query(`DELETE FROM "InventoryTransactions" WHERE "ProductId" = $1`, [id]);
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
