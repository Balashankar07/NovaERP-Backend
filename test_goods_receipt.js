const http = require('http');

const API_URL = 'http://localhost:5233/api';
let superAdminToken = '';
let supplierId = '';
let productId = '';
let poId = '';
let poItemId = '';
let poQuantity = 100;

async function makeRequest(method, endpoint, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_URL}${endpoint}`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let parsed = data;
                try {
                    parsed = JSON.parse(data);
                } catch (e) { }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('--- Starting Advanced GRN Verification ---');
    try {
        const loginRes = await makeRequest('POST', '/Auth/login', {
            email: 'balashankar07@gmail.com',
            password: 'Admin@123'
        });
        superAdminToken = loginRes.data.data.accessToken;

        const suppliersRes = await makeRequest('GET', '/Suppliers', null, superAdminToken);
        supplierId = suppliersRes.data.data.items[0].id;
        const productsRes = await makeRequest('GET', '/Products', null, superAdminToken);
        productId = productsRes.data.data.items[0].id;

        const poRes = await makeRequest('POST', '/PurchaseOrders', {
            supplierId: supplierId,
            expectedDeliveryDate: new Date(Date.now() + 86400000).toISOString(),
            currency: 'USD',
            remarks: 'PO for advanced GRN test',
            items: [{
                productId: productId,
                quantity: poQuantity,
                unitPrice: 10,
                discount: 0,
                tax: 0
            }]
        }, superAdminToken);
        poId = poRes.data.data.id;
        poItemId = poRes.data.data.items[0].id;

        await makeRequest('POST', `/PurchaseOrders/${poId}/submit`, null, superAdminToken);
        await makeRequest('POST', `/PurchaseOrders/${poId}/approve`, null, superAdminToken);
        console.log(`Created & Approved PO with 100 units.`);

        // 1. First GRN for 40 units
        let grn1Res = await makeRequest('POST', '/GoodsReceipts', {
            purchaseOrderId: poId,
            remarks: 'First batch (40 units)',
            items: [{ purchaseOrderItemId: poItemId, receivedQuantity: 40, rejectedQuantity: 0 }]
        }, superAdminToken);
        let grn1Id = grn1Res.data.data.id;
        
        await makeRequest('POST', `/GoodsReceipts/${grn1Id}/receive`, null, superAdminToken);
        await makeRequest('POST', `/GoodsReceipts/${grn1Id}/complete`, null, superAdminToken);
        console.log(`Completed GRN1 with 40 units.`);

        // PO Status Check
        let poCheck1 = await makeRequest('GET', `/PurchaseOrders/${poId}`, null, superAdminToken);
        console.log(`PO Status after GRN1: ${poCheck1.data.data.status} (Expected: Approved)`);

        // 2. Second GRN for 40 units
        let grn2Res = await makeRequest('POST', '/GoodsReceipts', {
            purchaseOrderId: poId,
            remarks: 'Second batch (40 units)',
            items: [{ purchaseOrderItemId: poItemId, receivedQuantity: 40, rejectedQuantity: 0 }]
        }, superAdminToken);
        let grn2Id = grn2Res.data.data.id;
        
        await makeRequest('POST', `/GoodsReceipts/${grn2Id}/receive`, null, superAdminToken);
        await makeRequest('POST', `/GoodsReceipts/${grn2Id}/complete`, null, superAdminToken);
        console.log(`Completed GRN2 with 40 units.`);

        // 3. Third GRN attempt for 30 units (Should fail, only 20 left)
        let grn3FailRes = await makeRequest('POST', '/GoodsReceipts', {
            purchaseOrderId: poId,
            items: [{ purchaseOrderItemId: poItemId, receivedQuantity: 30, rejectedQuantity: 0 }]
        }, superAdminToken);
        console.log(`GRN3 Attempt for 30 units (110 total): ${grn3FailRes.status} (Expected 500)`);

        // 4. Third GRN for remaining 20 units
        let grn3Res = await makeRequest('POST', '/GoodsReceipts', {
            purchaseOrderId: poId,
            remarks: 'Final batch (20 units)',
            items: [{ purchaseOrderItemId: poItemId, receivedQuantity: 20, rejectedQuantity: 0 }]
        }, superAdminToken);
        let grn3Id = grn3Res.data.data.id;
        
        await makeRequest('POST', `/GoodsReceipts/${grn3Id}/receive`, null, superAdminToken);
        await makeRequest('POST', `/GoodsReceipts/${grn3Id}/complete`, null, superAdminToken);
        console.log(`Completed GRN3 with 20 units (Total now 100).`);

        // PO Status Check
        let poCheck2 = await makeRequest('GET', `/PurchaseOrders/${poId}`, null, superAdminToken);
        console.log(`PO Status after all items received: ${poCheck2.data.data.status} (Expected: Closed)`);

        // Audit Logs Check for PO
        const auditRes = await makeRequest('GET', '/AuditLogs?sortBy=timestamp&sortOrder=desc&pageNumber=1&pageSize=50', null, superAdminToken);
        if (auditRes.status === 200) {
            const poLogs = auditRes.data.data.items.filter(l => l.entityName === 'PurchaseOrder' && l.action === 'StatusChange' && l.newValues === 'Closed');
            console.log(`PO Auto-Completion Audit Logs generated: ${poLogs.length} (Expected: 1)`);
        }

        console.log("All advanced tests completed.");
    } catch (error) {
        console.error("Test execution failed:", error);
    }
}

runTests();
