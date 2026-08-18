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

async function runTests() {
    console.log('=== Enterprise MRP Verification ===\\n');
    try {
        // 1. Login
        let loginRes = await makeRequest('POST', '/Auth/login', { email: 'balashankar07@gmail.com', password: 'Admin@123' });
        if (loginRes.status !== 200) throw new Error('Login failed');
        token = loginRes.data.data.accessToken;
        console.log('✅ Authenticated successfully.');

        const now = Date.now();

        // Prerequisites: Unit, Category, Brand
        let unitRes = await makeRequest('POST', '/Units', { name: 'Pieces ' + now, abbreviation: 'pcs' + now, description: 'Pieces' });
        let unitId = unitRes.data.data.id;

        let catRes = await makeRequest('POST', '/ProductCategories', { name: 'Test Cat ' + now, description: 'Test Cat', isActive: true });
        let catId = catRes.data.data.id;

        let brandRes = await makeRequest('POST', '/Brands', { name: 'Test Brand ' + now, description: 'Test Brand', isActive: true });
        let brandId = brandRes.data.data.id;

        // Raw Materials
        let rm1Res = await makeRequest('POST', '/Products', { 
            productCode: 'RM1-' + now, sku: 'SKU-RM1-' + now, name: 'RM Shortage', description: 'RM1', categoryId: catId, brandId: brandId, unitId: unitId,
            costPrice: 10, sellingPrice: 20, productType: 2, isActive: true 
        });
        let rm1Id = rm1Res.data.data.id;

        let rm2Res = await makeRequest('POST', '/Products', { 
            productCode: 'RM2-' + now, sku: 'SKU-RM2-' + now, name: 'RM Surplus', description: 'RM2', categoryId: catId, brandId: brandId, unitId: unitId,
            costPrice: 5, sellingPrice: 10, productType: 2, isActive: true 
        });
        let rm2Id = rm2Res.data.data.id;

        // Finished Goods
        let fgWithBomRes = await makeRequest('POST', '/Products', { 
            productCode: 'FG-BOM-' + now, sku: 'SKU-FG-BOM-' + now, name: 'FG With BOM', description: 'FG1', categoryId: catId, brandId: brandId, unitId: unitId,
            costPrice: 50, sellingPrice: 100, productType: 1, isActive: true 
        });
        let fgWithBomId = fgWithBomRes.data.data.id;

        let fgWithoutBomRes = await makeRequest('POST', '/Products', { 
            productCode: 'FG-NOBOM-' + now, sku: 'SKU-FG-NOBOM-' + now, name: 'FG No BOM', description: 'FG2', categoryId: catId, brandId: brandId, unitId: unitId,
            costPrice: 50, sellingPrice: 100, productType: 1, isActive: true 
        });
        let fgWithoutBomId = fgWithoutBomRes.data.data.id;

        // Warehouses for Inventory tests
        let wh1Res = await makeRequest('POST', '/Warehouses', { warehouseCode: 'WH1-' + now, warehouseName: 'Warehouse 1 ' + now, location: 'Loc 1', isDefault: false, isActive: true });
        if (wh1Res.status !== 201) { console.error('WH1 Error:', wh1Res.data); return; }
        let wh1Id = wh1Res.data.data.id;
        
        let wh2Res = await makeRequest('POST', '/Warehouses', { warehouseCode: 'WH2-' + now, warehouseName: 'Warehouse 2 ' + now, location: 'Loc 2', isDefault: false, isActive: true });
        if (wh2Res.status !== 201) { console.error('WH2 Error:', wh2Res.data); return; }
        let wh2Id = wh2Res.data.data.id;

        // Add Inventory (RM1 = 40 (Shortage), RM2 = 150 (Surplus spread across WH1 and WH2))
        async function seedInventory(productId, warehouseId, quantity, unitId, price) {
            // 1. Create Supplier
            let suppRes = await makeRequest('POST', '/Suppliers', { supplierCode: 'SUP-' + Date.now() + Math.floor(Math.random()*1000), supplierName: 'Test Supplier', contactPerson: 'John', email: 'test@sup.com', phone: '1234567890', isActive: true });
            if (suppRes.status !== 201) throw new Error('Supp Error: ' + JSON.stringify(suppRes.data));
            let supplierId = suppRes.data.data.id;
            
            // 2. Create PO
            let poRes = await makeRequest('POST', '/PurchaseOrders', {
                supplierId: supplierId,
                warehouseId: warehouseId,
                expectedDeliveryDate: new Date().toISOString(),
                remarks: 'Init inventory',
                items: [{ productId: productId, quantity: quantity, unitPrice: price, unitId: unitId }]
            });
            if (poRes.status !== 201) throw new Error('PO Error: ' + JSON.stringify(poRes.data));
            let poId = poRes.data.data.id;
            
            // Submit & Approve PO
            let subRes = await makeRequest('POST', `/PurchaseOrders/${poId}/submit`);
            if (subRes.status !== 200) throw new Error('PO Submit Error: ' + JSON.stringify(subRes.data));
            let appRes = await makeRequest('POST', `/PurchaseOrders/${poId}/approve`);
            if (appRes.status !== 200) throw new Error('PO Approve Error: ' + JSON.stringify(appRes.data));
            
            // Get PO Items for GRN
            let poItemsRes = await makeRequest('GET', `/PurchaseOrders/${poId}/items`);
            let poItemId = poItemsRes.data.data[0].id;
            
            // 3. Create GRN
            let grnRes = await makeRequest('POST', '/GoodsReceipts', {
                purchaseOrderId: poId,
                warehouseId: warehouseId,
                receivedDate: new Date().toISOString(),
                referenceNumber: 'REF-' + Date.now() + Math.floor(Math.random()*1000),
                remarks: 'Init',
                items: [{ purchaseOrderItemId: poItemId, productId: productId, receivedQuantity: quantity }]
            });
            if (grnRes.status !== 201) throw new Error('GRN Error: ' + JSON.stringify(grnRes.data));
            let grnId = grnRes.data.data.id;
            
            // Receive GRN (Updates Inventory)
            let compRes = await makeRequest('POST', `/GoodsReceipts/${grnId}/receive`);
            if (compRes.status !== 200) throw new Error('GRN Receive Error: ' + JSON.stringify(compRes.data));
        }

        console.log('Seeding Inventory via PO & GRN...');
        await seedInventory(rm1Id, wh1Id, 40, unitId, 10);
        await seedInventory(rm2Id, wh1Id, 100, unitId, 5);
        await seedInventory(rm2Id, wh2Id, 50, unitId, 5);
        console.log('Inventory seeded.');

        // Create BOM for fgWithBom
        let bomRes = await makeRequest('POST', '/BOMs', {
            productId: fgWithBomId,
            version: '1.0',
            description: 'BOM',
            isActive: true,
            items: [
                { rawMaterialProductId: rm1Id, quantity: 1, unitId: unitId }, // Need 100 for qty=100
                { rawMaterialProductId: rm2Id, quantity: 1, unitId: unitId }  // Need 100 for qty=100
            ]
        });
        
        console.log('\\n--- Scenario 1: No Active BOM ---');
        let planNoBom = { productId: fgWithoutBomId, plannedQuantity: 10, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2 };
        let noBomRes = await makeRequest('POST', '/ProductionPlans', planNoBom);
        assert(noBomRes.status === 400 && (JSON.stringify(noBomRes.data).includes('active BOM')), 'Fails with 400 Bad Request when no active BOM found.');

        console.log('\\n--- Scenario 2, 3, & 5: Inventory Calculation ---');
        let planRes = await makeRequest('POST', '/ProductionPlans', {
            productId: fgWithBomId, plannedQuantity: 100, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        assert(planRes.status === 201, 'Production plan created successfully.');
        let planId = planRes.data.data.id;

        let reqsRes = await makeRequest('GET', `/ProductionPlans/${planId}/requirements`);
        let reqs = reqsRes.data.data;
        
        let rm1Req = reqs.find(r => r.productId === rm1Id);
        assert(rm1Req.requiredQuantity === 100 && rm1Req.availableQuantity === 40 && rm1Req.shortageQuantity === 60, `Shortage calculation correct. (Required: ${rm1Req.requiredQuantity}, Available: ${rm1Req.availableQuantity}, Shortage: ${rm1Req.shortageQuantity})`);

        let rm2Req = reqs.find(r => r.productId === rm2Id);
        assert(rm2Req.requiredQuantity === 100 && rm2Req.availableQuantity === 150 && rm2Req.shortageQuantity === 0, `Surplus calculation and multiple warehouse aggregation correct. (Required: ${rm2Req.requiredQuantity}, Available: ${rm2Req.availableQuantity}, Shortage: ${rm2Req.shortageQuantity})`);

        console.log('\\n--- Scenario 4: Released Plan Protection ---');
        let releaseRes = await makeRequest('POST', `/ProductionPlans/${planId}/release`);
        assert(releaseRes.status === 200, 'Plan released successfully.');

        let updateRes = await makeRequest('PUT', `/ProductionPlans/${planId}`, {
            productId: fgWithBomId, plannedQuantity: 200, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        assert(updateRes.status === 400, 'PUT returns 400 for Released plan.');

        let deleteRes = await makeRequest('DELETE', `/ProductionPlans/${planId}`);
        assert(deleteRes.status === 400, 'DELETE returns 400 for Released plan.');

        console.log('\\n--- Scenario 6: Audit Logs ---');
        let auditRes = await makeRequest('GET', '/AuditLogs?pageNumber=1&pageSize=200&sortBy=Timestamp&sortOrder=desc');
        let logs = auditRes.data.data.items.filter(a => a.entityName === 'ProductionPlan' && a.entityId.toLowerCase() === planId.toLowerCase());
        
        let hasCreate = logs.some(l => l.action === 'Create');
        let hasRelease = logs.some(l => l.action === 'StatusChange' || l.action === 'Update');
        
        // Let's create a new draft plan to test delete and update logs
        let draftPlanRes = await makeRequest('POST', '/ProductionPlans', {
            productId: fgWithBomId, plannedQuantity: 10, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        let draftId = draftPlanRes.data.data.id;
        
        await makeRequest('PUT', `/ProductionPlans/${draftId}`, {
            productId: fgWithBomId, plannedQuantity: 20, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        await makeRequest('DELETE', `/ProductionPlans/${draftId}`);

        let auditRes2 = await makeRequest('GET', '/AuditLogs?pageNumber=1&pageSize=200&sortBy=Timestamp&sortOrder=desc');
        let logs2 = auditRes2.data.data.items.filter(a => a.entityName === 'ProductionPlan' && a.entityId.toLowerCase() === draftId.toLowerCase());
        
        let hasUpdate = logs2.some(l => l.action === 'Update');
        let hasDelete = logs2.some(l => l.action === 'Delete');

        assert(hasCreate, 'Create audit log found.');
        assert(hasUpdate, 'Update audit log found.');
        assert(hasRelease, 'Release (StatusChange) audit log found.');
        assert(hasDelete, 'Delete audit log found.');

        console.log('\\n✅ ALL VERIFICATIONS PASSED.');
    } catch (err) {
        console.error(err);
    }
}
runTests();
