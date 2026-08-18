const http = require('http');

const API_URL = 'http://localhost:5232/api';
let token = '';

async function makeRequest(method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_URL}${endpoint}`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = data;
                try { parsed = JSON.parse(data); } catch (e) {}
                resolve({ status: res.statusCode, data: parsed });
            });
        });
        req.on('error', e => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ ASSERTION FAILED: ${message}`);
        process.exit(1);
    } else {
        console.log(`✅ ${message}`);
    }
}

function check(res, name) {
    if (res.status !== 200 && res.status !== 201) {
        console.error(`❌ ${name} failed with status ${res.status}:`, JSON.stringify(res.data, null, 2));
        process.exit(1);
    }
}

async function runTests() {
    console.log('=== Production Execution Verification ===\n');
    try {
        // 1. Login
        let loginRes = await makeRequest('POST', '/Auth/login', { email: 'balashankar07@gmail.com', password: 'Admin@123' });
        if (loginRes.status !== 200) throw new Error('Login failed');
        token = loginRes.data.data.accessToken;
        console.log('✅ Authenticated successfully.');

        const now = Date.now();

        // Setup Prerequisites
        let unitRes = await makeRequest('POST', '/Units', { name: 'Pieces ' + now, abbreviation: 'pcs' + now, description: 'Pieces' });
        let unitId = unitRes.data.data.id;

        let catRes = await makeRequest('POST', '/ProductCategories', { name: 'Electronics ' + now, description: 'Electronics', isActive: true });
        let catId = catRes.data.data.id;

        let brandRes = await makeRequest('POST', '/Brands', { name: 'Nova ' + now, description: 'Nova Brand', isActive: true });
        let brandId = brandRes.data.data.id;

        // Raw Materials
        let rm1Res = await makeRequest('POST', '/Products', { 
            productCode: 'PCB-' + now, sku: 'PCB-' + now, name: 'PCB', description: 'PCB', categoryId: catId, brandId: brandId, unitId: unitId,
            costPrice: 10, sellingPrice: 20, productType: 2, isActive: true 
        });
        let rm1Id = rm1Res.data.data.id;

        let rm2Res = await makeRequest('POST', '/Products', { 
            productCode: 'SPK-' + now, sku: 'SPK-' + now, name: 'Speaker', description: 'Speaker', categoryId: catId, brandId: brandId, unitId: unitId,
            costPrice: 5, sellingPrice: 10, productType: 2, isActive: true 
        });
        let rm2Id = rm2Res.data.data.id;

        let rm3Res = await makeRequest('POST', '/Products', { 
            productCode: 'SCR-' + now, sku: 'SCR-' + now, name: 'Screw', description: 'Screw', categoryId: catId, brandId: brandId, unitId: unitId,
            costPrice: 1, sellingPrice: 2, productType: 2, isActive: true 
        });
        let rm3Id = rm3Res.data.data.id;

        // Finished Goods
        let fgRes = await makeRequest('POST', '/Products', { 
            productCode: 'RADIO-' + now, sku: 'RADIO-' + now, name: 'Radio', description: 'Radio FG', categoryId: catId, brandId: brandId, unitId: unitId,
            costPrice: 50, sellingPrice: 100, productType: 1, isActive: true 
        });
        let fgId = fgRes.data.data.id;

        // BOM
        let bomRes = await makeRequest('POST', '/BOMs', {
            productId: fgId,
            version: '1.0',
            description: 'Radio BOM',
            isActive: true,
            items: [
                { rawMaterialProductId: rm1Id, quantity: 1, unitId: unitId },   // 1 PCB per Radio
                { rawMaterialProductId: rm2Id, quantity: 2, unitId: unitId },   // 2 Speakers per Radio
                { rawMaterialProductId: rm3Id, quantity: 4, unitId: unitId }    // 4 Screws per Radio
            ]
        });

        // Setup Warehouse
        let whsRes = await makeRequest('GET', '/Warehouses?pageNumber=1&pageSize=100');
        let whId = whsRes.data.data.items.find(w => w.isDefault)?.id;
        if (!whId) {
            let whRes = await makeRequest('POST', '/Warehouses', { warehouseCode: 'MAIN-' + now, warehouseName: 'Main WH', address: 'HQ', isDefault: true, isActive: true });
            check(whRes, 'Warehouse Creation');
            whId = whRes.data.data.id;
        }

        // Setup Supplier
        let supRes = await makeRequest('POST', '/Suppliers', { supplierCode: 'SUP-' + now, supplierName: 'Main Supplier', contactPerson: 'John', email: 'sup@test.com', isActive: true });
        check(supRes, 'Supplier Creation');
        let supId = supRes.data.data.id;

        // Purchase Order for Raw Materials
        let poRes = await makeRequest('POST', '/PurchaseOrders', {
            supplierId: supId, expectedDeliveryDate: new Date().toISOString(), remarks: 'Initial Stock',
            items: [
                { productId: rm1Id, quantity: 100, unitPrice: 10, discount: 0, tax: 0 },
                { productId: rm2Id, quantity: 100, unitPrice: 5, discount: 0, tax: 0 },
                { productId: rm3Id, quantity: 200, unitPrice: 1, discount: 0, tax: 0 }
            ]
        });
        let poId = poRes.data.data.id;
        await makeRequest('POST', `/PurchaseOrders/${poId}/submit`);
        await makeRequest('POST', `/PurchaseOrders/${poId}/approve`);

        // Goods Receipt for PO
        let grnRes = await makeRequest('POST', '/GoodsReceipts', {
            purchaseOrderId: poId, remarks: 'Initial Receipt',
            items: [
                { purchaseOrderItemId: poRes.data.data.items[0].id, receivedQuantity: 100, rejectedQuantity: 0 },
                { purchaseOrderItemId: poRes.data.data.items[1].id, receivedQuantity: 100, rejectedQuantity: 0 },
                { purchaseOrderItemId: poRes.data.data.items[2].id, receivedQuantity: 200, rejectedQuantity: 0 }
            ]
        });
        let grnId = grnRes.data.data.id;
        await makeRequest('POST', `/GoodsReceipts/${grnId}/receive`);
        await makeRequest('POST', `/GoodsReceipts/${grnId}/complete`);
        console.log('✅ Added initial inventory via GRN.');

        let planRes = await makeRequest('POST', '/ProductionPlans', {
            productId: fgId, plannedQuantity: 20, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        let planId = planRes.data.data.id;
        await makeRequest('POST', `/ProductionPlans/${planId}/release`);

        let orderRes = await makeRequest('POST', '/ProductionOrders', {
            productionPlanId: planId, plannedQuantity: 10, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        let orderId = orderRes.data.data.id;
        await makeRequest('POST', `/ProductionOrders/${orderId}/release`);

        // Scenario 1: Create Execution
        let execRes = await makeRequest('POST', '/ProductionExecutions', { productionOrderId: orderId, remarks: 'First Execution' });
        assert(execRes.status === 201, 'Created Production Execution successfully.');
        let execId = execRes.data.data.id;

        // Scenario 5: Workflow (Cannot complete before start)
        let earlyCompleteRes = await makeRequest('POST', `/ProductionExecutions/${execId}/complete`, { producedQuantity: 10, rejectedQuantity: 0 });
        assert(earlyCompleteRes.status === 400, 'Cannot complete an unstarted execution.');

        // Start Execution
        let startRes = await makeRequest('POST', `/ProductionExecutions/${execId}/start`);
        assert(startRes.status === 200, 'Production Execution started successfully.');

        // Scenario 2: Insufficient Inventory check
        let secondOrderRes = await makeRequest('POST', '/ProductionOrders', {
            productionPlanId: planId, plannedQuantity: 10, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        let secondOrderId = secondOrderRes.data.data.id;
        await makeRequest('POST', `/ProductionOrders/${secondOrderId}/release`);
        let execRes2 = await makeRequest('POST', '/ProductionExecutions', { productionOrderId: secondOrderId, remarks: 'Insufficient Execution' });
        let execId2 = execRes2.data.data.id;
        await makeRequest('POST', `/ProductionExecutions/${execId2}/start`);

        // The first execution will consume 10 PCBs, 20 Speakers, 40 Screws (PO planned = 10)
        // Inventory is PCB 100, SPK 100, SCR 200. This is enough for the first execution.
        // Let's force an insufficient inventory scenario by consuming 1000 pieces of something.
        // I will adjust inventory to make SPK insufficient for a 30-quantity order.
        let badPlanRes = await makeRequest('POST', '/ProductionPlans', {
            productId: fgId, plannedQuantity: 60, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        await makeRequest('POST', `/ProductionPlans/${badPlanRes.data.data.id}/release`);
        let badOrderRes = await makeRequest('POST', '/ProductionOrders', {
            productionPlanId: badPlanRes.data.data.id, plannedQuantity: 60, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        await makeRequest('POST', `/ProductionOrders/${badOrderRes.data.data.id}/release`);
        let badExecRes = await makeRequest('POST', '/ProductionExecutions', { productionOrderId: badOrderRes.data.data.id });
        await makeRequest('POST', `/ProductionExecutions/${badExecRes.data.data.id}/start`);

        // Requires 60 PCB (avail 100) - OK, 120 Speakers (avail 100) - BAD!
        let badConsumeRes = await makeRequest('POST', `/ProductionExecutions/${badExecRes.data.data.id}/consume`);
        assert(badConsumeRes.status === 400, 'Insufficient inventory correctly blocks consumption.');

        // Scenario 4: Inventory Atomicity
        // Check PCB inventory to ensure it wasn't partially consumed
        let invRes = await makeRequest('GET', `/Inventory/by-product/${rm1Id}`);
        if (!invRes.data || !invRes.data.data || invRes.data.data.length === 0) {
            console.error('Inventory not found for PCB:', rm1Id, invRes.data);
        }
        let pcbInv = invRes.data.data[0];
        assert(pcbInv.quantityAvailable === 100, 'Inventory Atomicity PASS: No partial updates. PCB remains 100.');

        // Scenario 1: Material Consumption
        let consumeRes = await makeRequest('POST', `/ProductionExecutions/${execId}/consume`);
        assert(consumeRes.status === 200, 'Materials consumed successfully for valid execution.');

        // Verify inventory after consumption
        let invResAfter1 = await makeRequest('GET', `/Inventory/by-product/${rm1Id}`);
        let invResAfter2 = await makeRequest('GET', `/Inventory/by-product/${rm2Id}`);
        let pcbAfter = invResAfter1.data.data[0];
        let spkAfter = invResAfter2.data.data[0];
        assert(pcbAfter.quantityAvailable === 90, 'Material Consumption PASS: PCB reduced to 90 (100 - 1*10).');
        assert(spkAfter.quantityAvailable === 80, 'Material Consumption PASS: Speaker reduced to 80 (100 - 2*10).');

        // Scenario 7: Double Consumption
        let doubleConsumeRes = await makeRequest('POST', `/ProductionExecutions/${execId}/consume`);
        assert(doubleConsumeRes.status === 400, 'Double consumption blocked.');

        // Scenario 3 & 8: Finished Goods & Validation
        let completeRes = await makeRequest('POST', `/ProductionExecutions/${execId}/complete`, { producedQuantity: 8, rejectedQuantity: 2 });
        assert(completeRes.status === 200, 'Execution completed successfully with 8 produced and 2 rejected.');

        let fgInvRes = await makeRequest('GET', `/Inventory/by-product/${fgId}`);
        let fgInv = fgInvRes.data.data[0];
        assert(fgInv && fgInv.quantityAvailable === 8, 'Finished Goods PASS: Inventory increased by EXACTLY the produced (accepted) quantity of 8.');

        // Check Inventory Transactions
        let pcbTrans = await makeRequest('GET', `/Inventory/${pcbInv.id}/transactions?pageNumber=1&pageSize=100`);
        let spkTrans = await makeRequest('GET', `/Inventory/${spkAfter.id}/transactions?pageNumber=1&pageSize=100`);
        let scrInvRes = await makeRequest('GET', `/Inventory/by-product/${rm3Id}`);
        let scrTrans = await makeRequest('GET', `/Inventory/${scrInvRes.data.data[0].id}/transactions?pageNumber=1&pageSize=100`);
        
        let allTrans = [...pcbTrans.data.data.items, ...spkTrans.data.data.items, ...scrTrans.data.data.items];
        let issueTransactions = allTrans.filter(t => t.referenceId === execId && (t.transactionType === 2 || t.transactionType === 'ProductionIssue'));
        
        let fgTrans = await makeRequest('GET', `/Inventory/${fgInv.id}/transactions?pageNumber=1&pageSize=100`);
        let receiptTransactions = fgTrans.data.data.items.filter(t => t.referenceId === execId && (t.transactionType === 3 || t.transactionType === 'ProductionReceipt'));

        assert(issueTransactions.length === 3, `One More Important Check PASS: There are exactly ${issueTransactions.length} ProductionIssue transactions (expected 3 for PCB, SPK, SCR).`);
        assert(receiptTransactions.length === 1, `Finished Goods Receipt Transaction exists.`);

        // Scenario 6: Double Completion
        let doubleCompleteRes = await makeRequest('POST', `/ProductionExecutions/${execId}/complete`, { producedQuantity: 1, rejectedQuantity: 0 });
        assert(doubleCompleteRes.status === 400, 'Double completion blocked.');

        // Scenario 5: Order Workflow - Cannot start after complete
        let restartRes = await makeRequest('POST', `/ProductionExecutions/${execId}/start`);
        assert(restartRes.status === 400, 'Cannot start a completed execution.');

        // Scenario 9: Audit Logs
        let auditRes = await makeRequest('GET', '/AuditLogs?pageNumber=1&pageSize=200&sortBy=Timestamp&sortOrder=desc');
        let logs = auditRes.data.data.items.filter(a => a.entityName === 'ProductionExecution' && a.entityId.toLowerCase() === execId.toLowerCase());
        
        let hasCreate = logs.some(l => l.action === 'Create');
        let hasStart = logs.some(l => l.action === 'StatusChange' && l.newValues.includes('Started'));
        let hasConsume = logs.some(l => l.action === 'Consume');
        let hasComplete = logs.some(l => l.action === 'StatusChange' && l.newValues.includes('Completed'));

        // Cancel test on the second execution
        await makeRequest('POST', `/ProductionExecutions/${execId2}/cancel`, { reason: 'Test' });
        
        let auditRes2 = await makeRequest('GET', '/AuditLogs?pageNumber=1&pageSize=200&sortBy=Timestamp&sortOrder=desc');
        let exec2Logs = auditRes2.data.data.items.filter(a => a.entityName === 'ProductionExecution' && a.entityId.toLowerCase() === execId2.toLowerCase());
        let hasCancel = exec2Logs.some(l => l.action === 'StatusChange' && l.newValues.includes('Cancelled'));

        if (!(hasCreate && hasStart && hasConsume && hasComplete && hasCancel)) {
            console.log('DEBUG Audit:', { hasCreate, hasStart, hasConsume, hasComplete, hasCancel });
        }
        assert(hasCreate && hasStart && hasConsume && hasComplete && hasCancel, 'Audit Logs PASS: Create, Start, Consume, Complete, Cancel verified.');

        // Scenario 10: RBAC
        let empLoginRes = await makeRequest('POST', '/Auth/login', { email: 'employee@novaerp.com', password: 'Employee@123' });
        let empToken = empLoginRes.data.data.accessToken;
        
        const oldToken = token;
        token = empToken;
        let rbacFailRes = await makeRequest('POST', '/ProductionExecutions', { productionOrderId: orderId });
        assert(rbacFailRes.status === 403, 'RBAC PASS: Employee gets 403 Forbidden.');
        
        token = oldToken;
        let rbacPassRes = await makeRequest('POST', '/ProductionExecutions', { productionOrderId: secondOrderId });
        assert(rbacPassRes.status === 201, 'RBAC PASS: Super Admin gets 201 Created.');

        console.log('\n✅ ALL VERIFICATIONS PASSED 10/10.');
    } catch (err) {
        console.error('Fatal error:', err);
    }
}
runTests();
