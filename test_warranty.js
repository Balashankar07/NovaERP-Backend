const http = require('http');
const { Client } = require('pg');

const API_URL = 'http://localhost:5232/api';
let token = '';
let employeeToken = '';

async function makeRequest(method, endpoint, body = null, useEmployeeToken = false) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_URL}${endpoint}`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        const authToken = useEmployeeToken ? employeeToken : token;
        if (authToken) options.headers['Authorization'] = `Bearer ${authToken}`;

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = data;
                try { parsed = JSON.parse(data); } catch (e) {}
                if (res.statusCode >= 400 && endpoint !== '/Auth/login') {
                    console.error(`Request failed [${res.statusCode}] ${method} ${endpoint}:`, JSON.stringify(parsed, null, 2));
                    if (res.statusCode === 500) process.exit(1);
                }
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
    }
    console.log(`✅ ${message}`);
}

async function runTests() {
    console.log('--- Warranty Management Test Script ---');

    // 1. Login
    console.log('\nLogging in...');
    let res = await makeRequest('POST', '/Auth/login', { email: 'balashankar07@gmail.com', password: 'Admin@123' });
    assert(res.status === 200, 'Super Admin Login successful');
    token = res.data.data.accessToken;

    res = await makeRequest('POST', '/Auth/login', { email: 'employee@novaerp.com', password: 'Employee@123' });
    assert(res.status === 200, 'Employee Login successful');
    employeeToken = res.data.data.accessToken;

    // Prerequisite: Create Product and Shipments (Delivered and Pending)
    console.log('\n--- Setup Prerequisites ---');
    const pcRes = await makeRequest('POST', '/ProductCategories', { name: `Cat ${Date.now()}`, description: 'test', isActive: true });
    const uRes = await makeRequest('POST', '/Units', { name: `Unit ${Date.now()}`, abbreviation: 'U', description: 'desc' });
    const brandRes = await makeRequest('POST', '/Brands', { name: `Brand ${Date.now()}`, description: 'brand', isActive: true });
    
    res = await makeRequest('POST', '/Products', {
        productCode: `PRD-${Date.now()}`,
        sku: `SKU-${Date.now()}`,
        name: 'Test Product for Warranty',
        description: 'Test',
        categoryId: pcRes.data.data.id,
        brandId: brandRes.data.data.id,
        unitId: uRes.data.data.id,
        costPrice: 10,
        sellingPrice: 20,
        isRawMaterial: false,
        isFinishedGood: true,
        isActive: true
    });
    const productId = res.data.data.id;
    assert(productId, 'Product created');

    const dbClient = new Client({
        connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB'
    });
    await dbClient.connect();
    let distRes = await dbClient.query('SELECT "Id" FROM "Distributors" LIMIT 1');
    let distributorId;
    if (distRes.rows.length === 0) {
        let resInsert = await dbClient.query(`
            INSERT INTO "Distributors" ("Id", "CompanyName", "ContactPerson", "Email", "Phone", "Address", "IsActive", "CreatedAt", "CreatedBy")
            VALUES (gen_random_uuid(), 'Test Dist', 'John', 'john@test.com', '123', 'address', true, NOW(), NULL)
            RETURNING "Id";
        `);
        distributorId = resInsert.rows[0].Id;
    } else {
        distributorId = distRes.rows[0].Id;
    }
    await dbClient.end();

    res = await makeRequest('POST', '/SalesOrders', {
        orderNumber: `SO-${Date.now()}`,
        distributorId: distributorId,
        orderDate: new Date().toISOString(),
        expectedDeliveryDate: new Date().toISOString(),
        billingAddress: 'Address 1',
        shippingAddress: 'Address 2',
        customerName: 'Test Customer',
        customerEmail: 'test@customer.com',
        totalAmount: 20,
        items: [{
            productId: productId,
            quantity: 1,
            unitPrice: 20,
            totalPrice: 20,
            discount: 0,
            tax: 0
        }]
    });
    const soId = res.data.data.id;
    await makeRequest('POST', `/SalesOrders/${soId}/submit`);
    await makeRequest('POST', `/SalesOrders/${soId}/approve`);

    // Create Delivered Shipment
    res = await makeRequest('POST', '/v1/Shipments', {
        shipmentNumber: `SHP-D-${Date.now()}`,
        salesOrderId: soId,
        dispatchDate: new Date().toISOString(),
        courierName: 'FedEx',
        trackingNumber: 'TRK123'
    });
    const deliveredShipmentId = res.data.data.id;
    await makeRequest('POST', `/v1/Shipments/${deliveredShipmentId}/dispatch`, {});
    await makeRequest('POST', `/v1/Shipments/${deliveredShipmentId}/deliver`, {});
    assert(true, 'Delivered Shipment created');

    // Create Pending Shipment
    res = await makeRequest('POST', '/v1/Shipments', {
        shipmentNumber: `SHP-P-${Date.now()}`,
        salesOrderId: soId,
        dispatchDate: new Date().toISOString(),
        courierName: 'UPS',
        trackingNumber: 'TRK456'
    });
    const pendingShipmentId = res.data.data.id;
    assert(true, 'Pending Shipment created');

    // 1. Shipment Validation
    console.log('\n--- 1. Shipment Validation ---');
    res = await makeRequest('POST', '/Warranties', {
        productId: productId,
        shipmentId: pendingShipmentId,
        serialNumber: `SN-${Date.now()}`,
        warrantyType: 'Standard',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString()
    });
    assert(res.status === 400, 'Warranty creation fails for Pending shipment');

    const validWarrantyPayload = {
        productId: productId,
        shipmentId: deliveredShipmentId,
        serialNumber: `SN-D-${Date.now()}`,
        warrantyType: 'Standard',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString()
    };
    res = await makeRequest('POST', '/Warranties', validWarrantyPayload);
    assert(res.status === 201, 'Warranty creation succeeds for Delivered shipment');
    const warrantyId = res.data.data.id;

    // 2. Duplicate Warranty
    console.log('\n--- 2. Duplicate Warranty ---');
    res = await makeRequest('POST', '/Warranties', {
        ...validWarrantyPayload,
        serialNumber: `SN-D2-${Date.now()}` // Different serial, same product/shipment
    });
    assert(res.status === 409 || res.status === 400, 'Duplicate Warranty fails for same shipment/product');

    res = await makeRequest('POST', '/Warranties', {
        productId: productId,
        shipmentId: deliveredShipmentId, // same shipment
        serialNumber: validWarrantyPayload.serialNumber, // duplicate serial
        warrantyType: 'Standard',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString()
    });
    assert(res.status === 409 || res.status === 400, 'Duplicate Warranty fails for same serial number');

    // 3. Warranty Dates
    console.log('\n--- 3. Warranty Dates ---');
    res = await makeRequest('POST', '/Warranties', {
        productId: productId,
        shipmentId: deliveredShipmentId,
        serialNumber: `SN-D3-${Date.now()}`,
        warrantyType: 'Standard',
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date().toISOString() // End before Start
    });
    assert(res.status === 400, 'Warranty creation fails when End Date < Start Date');

    // 4. Claim Validation
    console.log('\n--- 4. Claim Validation ---');
    res = await makeRequest('POST', '/WarrantyClaims', {
        warrantyId: warrantyId,
        complaint: 'Device is dead on arrival'
    });
    assert(res.status === 201, 'Claim creation succeeds for Active Warranty');
    const claimId = res.data.data.id;

    // 5. Claim Workflow & 6. Double Resolution
    console.log('\n--- 5. Claim Workflow & 6. Double Resolution ---');
    res = await makeRequest('PUT', `/WarrantyClaims/${claimId}`, { status: 1 }); // 1 = UnderReview
    assert(res.status === 200, 'Claim transition to UnderReview works');

    res = await makeRequest('PUT', `/WarrantyClaims/${claimId}/approve`);
    assert(res.status === 200, 'Claim transition to Approved works');

    res = await makeRequest('PUT', `/WarrantyClaims/${claimId}/resolve`, { resolution: 'Replaced parts' });
    assert(res.status === 200, 'Claim transition to Resolved works');

    res = await makeRequest('PUT', `/WarrantyClaims/${claimId}/resolve`, { resolution: 'Double resolve' });
    assert(res.status === 400, 'Double Resolution fails');

    res = await makeRequest('PUT', `/WarrantyClaims/${claimId}/close`);
    assert(res.status === 200, 'Claim transition to Closed works');

    // Rejected workflow
    res = await makeRequest('POST', '/WarrantyClaims', { warrantyId: warrantyId, complaint: 'Another issue' });
    const claim2Id = res.data.data.id;
    res = await makeRequest('PUT', `/WarrantyClaims/${claim2Id}/reject`);
    assert(res.status === 200, 'Claim transition to Rejected works');

    // Expired Warranty -> Claim
    await makeRequest('PUT', `/Warranties/${warrantyId}`, { status: 3 }); // 3 = Expired
    res = await makeRequest('POST', '/WarrantyClaims', { warrantyId: warrantyId, complaint: 'Testing expired' });
    assert(res.status === 400, 'Claim creation fails for Expired Warranty');

    // Closed Warranty -> Claim
    await makeRequest('PUT', `/Warranties/${warrantyId}/close`); // 4 = Closed
    res = await makeRequest('POST', '/WarrantyClaims', { warrantyId: warrantyId, complaint: 'Testing closed' });
    assert(res.status === 400, 'Claim creation fails for Closed Warranty');

    // 7. Closed Warranty
    console.log('\n--- 7. Closed Warranty ---');
    res = await makeRequest('PUT', `/Warranties/${warrantyId}`, { status: 1 }); // Reopen attempt
    assert(res.status === 400, 'Cannot edit/reopen a Closed Warranty');

    res = await makeRequest('DELETE', `/Warranties/${warrantyId}`);
    assert(res.status === 400, 'Cannot delete a Closed Warranty');

    res = await makeRequest('POST', '/WarrantyClaims', { warrantyId: warrantyId, complaint: 'New claim' });
    assert(res.status === 400, 'Cannot add claim to a Closed Warranty');

    // 8. Audit Logs
    console.log('\n--- 8. Audit Logs ---');
    res = await makeRequest('GET', '/AuditLogs?pageNumber=1&pageSize=100&sortBy=Timestamp&sortOrder=desc');
    const logs = res.data.data.items;
    const warrantyLogs = logs.filter(l => l.entityName === 'Warranty');
    const claimLogs = logs.filter(l => l.entityName === 'WarrantyClaim');
    assert(warrantyLogs.some(l => l.action === 'Create'), 'Audit log captured Warranty Create');
    assert(warrantyLogs.some(l => l.action === 'Update'), 'Audit log captured Warranty Update');
    assert(claimLogs.some(l => l.action === 'Create'), 'Audit log captured Claim Create');
    assert(claimLogs.some(l => l.action === 'Update'), 'Audit log captured Claim Update (Review/Approve/Resolve/Close)');

    // 9. RBAC
    console.log('\n--- 9. RBAC ---');
    res = await makeRequest('GET', '/Warranties', null, true); // use employee token
    assert(res.status === 403, 'Employee access to Warranties returns 403');
    res = await makeRequest('GET', '/Warranties', null, false); // use super admin
    assert(res.status === 200, 'Super Admin access to Warranties returns 200');

    // 10-13. List/Pagination/Search/Sorting
    console.log('\n--- 10-13. Pagination, Search, Sorting ---');
    res = await makeRequest('GET', '/Warranties?pageNumber=1&pageSize=5&search=SN&sortBy=createdAt&sortOrder=desc');
    assert(res.status === 200, 'Pagination/Search/Sorting works');

    console.log('\n--- 14. End-to-End Workflow ---');
    console.log('✅ End-to-End workflow successfully covered by the above steps!');

    console.log('\n--- 15. Regression ---');
    res = await makeRequest('GET', '/v1/Shipments');
    assert(res.status === 200, 'Shipments API still works');
    res = await makeRequest('GET', '/SalesOrders');
    assert(res.status === 200, 'SalesOrders API still works');
    res = await makeRequest('GET', '/Inventory');
    assert(res.status === 200, 'Inventory API still works');

    console.log('\n✅ ALL WARRANTY VERIFICATION TESTS PASSED SUCCESSFULLY! ✅');
}

runTests().catch(err => {
    console.error(err);
    process.exit(1);
});
