const http = require('http');

const API_URL = 'http://localhost:5233/api';
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
    console.log('=== Production Orders Verification ===\n');
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
        if (!rm1Res.data.data) {
            console.error('Failed to create RM1:', rm1Res.data);
            process.exit(1);
        }
        let rm1Id = rm1Res.data.data.id;

        // Finished Goods
        let fgWithBomRes = await makeRequest('POST', '/Products', { 
            productCode: 'FG-BOM-' + now, sku: 'SKU-FG-BOM-' + now, name: 'FG With BOM', description: 'FG1', categoryId: catId, brandId: brandId, unitId: unitId,
            costPrice: 50, sellingPrice: 100, productType: 1, isActive: true 
        });
        let fgWithBomId = fgWithBomRes.data.data.id;

        let bomRes = await makeRequest('POST', '/BOMs', {
            productId: fgWithBomId,
            version: '1.0',
            description: 'BOM',
            isActive: true,
            items: [
                { rawMaterialProductId: rm1Id, quantity: 1, unitId: unitId }
            ]
        });

        let planRes = await makeRequest('POST', '/ProductionPlans', {
            productId: fgWithBomId, plannedQuantity: 100, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        let planId = planRes.data.data.id;

        console.log('\n--- Scenario 1: Create Production Order for Draft Plan ---');
        let orderResDraftPlan = await makeRequest('POST', '/ProductionOrders', {
            productionPlanId: planId, plannedQuantity: 50, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        assert(orderResDraftPlan.status === 400, 'Cannot create Production Order for Draft Plan');

        console.log('\n--- Scenario 2: Create Production Order for Released Plan ---');
        let planReleaseRes = await makeRequest('POST', `/ProductionPlans/${planId}/release`);
        if (planReleaseRes.status !== 200) {
            console.error('Failed to release plan:', planReleaseRes.data);
        }
        
        let orderRes = await makeRequest('POST', '/ProductionOrders', {
            productionPlanId: planId, plannedQuantity: 50, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2, workCenter: 'WC-01'
        });
        if (orderRes.status !== 201) {
            console.error('Failed to create Production Order:', orderRes.status, orderRes.data);
        }
        assert(orderRes.status === 201, 'Production Order created successfully.');
        let orderId = orderRes.data.data.id;

        console.log('\n--- Scenario 3: Exceed Plan Quantity ---');
        let orderResExceed = await makeRequest('POST', '/ProductionOrders', {
            productionPlanId: planId, plannedQuantity: 60, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        assert(orderResExceed.status === 400, 'Cannot exceed Plan Quantity (50 + 60 > 100).');

        console.log('\n--- Scenario 4: Update Production Order ---');
        let updateRes = await makeRequest('PUT', `/ProductionOrders/${orderId}`, {
            plannedQuantity: 60, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2, workCenter: 'WC-02'
        });
        assert(updateRes.status === 200, 'Production Order updated successfully (quantity 50 -> 60).');
        assert(updateRes.data.data.workCenter === 'WC-02', 'WorkCenter updated.');

        console.log('\n--- Scenario 5: Delete Production Order ---');
        let dummyOrderRes = await makeRequest('POST', '/ProductionOrders', {
            productionPlanId: planId, plannedQuantity: 10, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        let dummyId = dummyOrderRes.data.data.id;
        let deleteRes = await makeRequest('DELETE', `/ProductionOrders/${dummyId}`);
        assert(deleteRes.status === 200, 'Draft Production Order deleted successfully.');

        console.log('\n--- Scenario 6: Lifecycle (Release -> Start -> Complete) ---');
        let releaseRes = await makeRequest('POST', `/ProductionOrders/${orderId}/release`);
        assert(releaseRes.status === 200, 'Production Order released.');
        
        let updateReleasedRes = await makeRequest('PUT', `/ProductionOrders/${orderId}`, {
            plannedQuantity: 70, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        assert(updateReleasedRes.status === 400, 'Cannot update planned quantity of released order.');

        let startFailRes = await makeRequest('POST', `/ProductionOrders/${orderId}/start`, { startedQuantity: 100 });
        assert(startFailRes.status === 400, 'Started quantity cannot exceed planned quantity.');

        let startRes = await makeRequest('POST', `/ProductionOrders/${orderId}/start`, { startedQuantity: 60 });
        assert(startRes.status === 200, 'Production Order started successfully.');
        
        let completeFailRes = await makeRequest('POST', `/ProductionOrders/${orderId}/complete`, { completedQuantity: 50, rejectedQuantity: 20 });
        assert(completeFailRes.status === 400, 'Completed + Rejected cannot exceed started quantity.');

        let completeRes = await makeRequest('POST', `/ProductionOrders/${orderId}/complete`, { completedQuantity: 58, rejectedQuantity: 2 });
        assert(completeRes.status === 200, 'Production Order completed successfully.');

        console.log('\n--- Scenario 7: Cancel Order ---');
        let cancelOrderRes = await makeRequest('POST', '/ProductionOrders', {
            productionPlanId: planId, plannedQuantity: 20, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        let cancelId = cancelOrderRes.data.data.id;
        let cancelActionRes = await makeRequest('POST', `/ProductionOrders/${cancelId}/cancel`, { reason: 'Test Cancel' });
        assert(cancelActionRes.status === 200, 'Production Order cancelled successfully.');
        assert(cancelActionRes.data.data.status === 'Cancelled' || cancelActionRes.data.data.status === 4, 'Status is Cancelled.');

        console.log('\n--- Scenario 8: Pagination and Search ---');
        let listRes = await makeRequest('GET', '/ProductionOrders?pageNumber=1&pageSize=10&search=WC-02');
        assert(listRes.status === 200, 'Search and Pagination works.');
        assert(listRes.data.data.items.some(x => x.id === orderId), 'Search returned the expected order.');

        console.log('\n--- Scenario 9: Audit Logs ---');
        let auditRes = await makeRequest('GET', '/AuditLogs?pageNumber=1&pageSize=200&sortBy=Timestamp&sortOrder=desc');
        let logs = auditRes.data.data.items.filter(a => a.entityName === 'ProductionOrder' && a.entityId.toLowerCase() === orderId.toLowerCase());
        
        let hasCreate = logs.some(l => l.action === 'Create');
        let hasUpdate = logs.some(l => l.action === 'Update');
        let hasStatusChangeRelease = logs.some(l => l.action === 'StatusChange' && l.newValues.includes('Released'));
        let hasStatusChangeStart = logs.some(l => l.action === 'StatusChange' && l.newValues.includes('InProgress'));
        let hasStatusChangeComplete = logs.some(l => l.action === 'StatusChange' && l.newValues.includes('Completed'));

        let dummyLogs = auditRes.data.data.items.filter(a => a.entityName === 'ProductionOrder' && a.entityId.toLowerCase() === dummyId.toLowerCase());
        let hasDelete = dummyLogs.some(l => l.action === 'Delete');

        assert(hasCreate, 'Create audit log found.');
        assert(hasUpdate, 'Update audit log found.');
        assert(hasStatusChangeRelease, 'Release (StatusChange) audit log found.');
        assert(hasStatusChangeStart, 'Start (StatusChange) audit log found.');
        assert(hasStatusChangeComplete, 'Complete (StatusChange) audit log found.');
        assert(hasDelete, 'Delete audit log found.');

        console.log('\n✅ ALL VERIFICATIONS PASSED.');
    } catch (err) {
        console.error(err);
    }
}
runTests();
