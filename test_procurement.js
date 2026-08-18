const http = require('http');

const API_URL = 'http://localhost:5233/api';
let superAdminToken = '';
let supplierId = '';
let productId = '';
let poId = '';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function makeRequest(method, endpoint, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_URL}${endpoint}`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => {
                let parsed = null;
                if (responseBody) {
                    try { parsed = JSON.parse(responseBody); } catch (e) { parsed = responseBody; }
                }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    console.log("--- Starting Procurement API Verification ---");

    // 1. Login as Super Admin
    const loginRes = await makeRequest('POST', '/Auth/login', {
        email: 'balashankar07@gmail.com',
        password: 'Admin@123'
    });
    
    if (loginRes.status === 200 && loginRes.data.data.accessToken) {
        superAdminToken = loginRes.data.data.accessToken;
        console.log("Super Admin Login successful.");
    } else {
        console.error("Super Admin Login failed:", loginRes);
        return;
    }

    // 2. Setup: Get a Supplier and a Product
    const suppliersRes = await makeRequest('GET', '/Suppliers', null, superAdminToken);
    if (suppliersRes.status === 200 && suppliersRes.data.data.items.length > 0) {
        supplierId = suppliersRes.data.data.items[0].id;
    } else {
        console.log("No supplier found. Create one first or check seed data.");
        return;
    }

    const productsRes = await makeRequest('GET', '/Products', null, superAdminToken);
    if (productsRes.status === 200 && productsRes.data.data.items.length > 0) {
        productId = productsRes.data.data.items[0].id;
    } else {
        console.log("No product found. Create one first or check seed data.");
        return;
    }

    // 2.5 Ensure SupplierProduct link exists
    console.log(`Ensuring SupplierProduct link exists for Supplier: ${supplierId}, Product: ${productId}`);
    const spRes = await makeRequest('POST', '/supplier-products', {
        supplierId: supplierId,
        productId: productId,
        supplierSKU: "TEST-SKU-001",
        unitPrice: 100,
        currency: "USD",
        moq: 10,
        leadTimeDays: 7,
        isPreferred: true,
        isActive: true
    }, superAdminToken);

    // It might already exist (409 Conflict), which is fine, we just need to ensure it's active.
    if (spRes.status === 201) {
        console.log("Created SupplierProduct link.");
    } else if (spRes.status === 409) {
        console.log("SupplierProduct link already exists.");
        // We could fetch and activate it, but let's assume it's active for now or we will get a 400.
    } else {
        console.error("Failed to create SupplierProduct link:", spRes);
        // Continue anyway to see if it works.
    }

    // 3. Test Create Purchase Order
    const createData = {
        supplierId: supplierId,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        currency: "USD",
        remarks: "Test PO created by script",
        items: [
            {
                productId: productId,
                quantity: 10,
                unitPrice: 100,
                discount: 50,
                tax: 10,
                remarks: "Test Item 1"
            }
        ]
    };

    const createRes = await makeRequest('POST', '/PurchaseOrders', createData, superAdminToken);
    if (createRes.status === 201) {
        console.log("Create PurchaseOrder: 201 Operation completed successfully.");
        poId = createRes.data.data.id;
        console.log("Created PO Number:", createRes.data.data.poNumber);
        console.log("Calculated Totals:", {
            subtotal: createRes.data.data.subtotal,
            tax: createRes.data.data.taxAmount,
            discount: createRes.data.data.discountAmount,
            total: createRes.data.data.totalAmount
        });
    } else {
        console.error("Create PurchaseOrder failed:", createRes);
        return;
    }

    // 4. Test RBAC: Missing token (401)
    const unauthorizedRes = await makeRequest('GET', '/PurchaseOrders');
    console.log(`RBAC Check (Unauthorized GET): ${unauthorizedRes.status}`);

    // 5. Test Update Purchase Order (while Draft)
    const updateData = {
        supplierId: supplierId,
        expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        currency: "EUR",
        remarks: "Updated Remarks",
        isActive: true,
        items: [
            {
                id: createRes.data.data.items[0].id,
                productId: productId,
                quantity: 20,
                unitPrice: 100,
                discount: 100,
                tax: 20,
                remarks: "Updated Test Item 1"
            }
        ]
    };

    const updateRes = await makeRequest('PUT', `/PurchaseOrders/${poId}`, updateData, superAdminToken);
    if (updateRes.status === 200) {
        console.log("Update PurchaseOrder (Draft): 200 Operation completed successfully.");
    } else {
        console.error("Update PurchaseOrder failed:", updateRes);
    }

    // 6. Test Status Transitions: Submit -> Approve
    const submitRes = await makeRequest('POST', `/PurchaseOrders/${poId}/submit`, null, superAdminToken);
    if (submitRes.status === 200) {
        console.log("Submit PurchaseOrder: 200 Status changed to", submitRes.data.data.status);
    } else {
        console.error("Submit PurchaseOrder failed:", submitRes);
    }

    const approveRes = await makeRequest('POST', `/PurchaseOrders/${poId}/approve`, null, superAdminToken);
    if (approveRes.status === 200) {
        console.log("Approve PurchaseOrder: 200 Status changed to", approveRes.data.data.status);
    } else {
        console.error("Approve PurchaseOrder failed:", approveRes);
    }

    // 7. Test Delete failure (cannot delete Approved)
    const deleteFailRes = await makeRequest('DELETE', `/PurchaseOrders/${poId}`, null, superAdminToken);
    if (deleteFailRes.status === 400) { // Should be a bad request due to business rule exception
        console.log("Delete PurchaseOrder (Approved) Failed as expected: 400", deleteFailRes.data.message);
    } else {
        console.log("Delete PurchaseOrder unexpected status:", deleteFailRes.status);
    }

    // 8. Test Delete (Create new Draft and Delete)
    const createData2 = { ...createData };
    const createRes2 = await makeRequest('POST', '/PurchaseOrders', createData2, superAdminToken);
    if (createRes2.status === 201) {
        const deleteRes = await makeRequest('DELETE', `/PurchaseOrders/${createRes2.data.data.id}`, null, superAdminToken);
        console.log(`Delete PurchaseOrder (Draft): ${deleteRes.status}`);
    }

    // 9. Test Pagination & Search
    const searchRes = await makeRequest('GET', `/PurchaseOrders?pageNumber=1&pageSize=5`, null, superAdminToken);
    if (searchRes.status === 200) {
        console.log(`GetAll (Pagination): 200 Count: ${searchRes.data.data.items.length}, Total: ${searchRes.data.data.totalCount}`);
    } else {
        console.error("GetAll (Pagination) failed:", searchRes);
    }

    // 10. Test Audit Logs
    const auditRes = await makeRequest('GET', '/AuditLogs?sortBy=timestamp&sortOrder=desc&pageNumber=1&pageSize=50', null, superAdminToken);
    if (auditRes.status === 200) {
        console.log(`First 3 audit logs:`, auditRes.data.data.items.slice(0, 3).map(l => ({ action: l.action, entityName: l.entityName, oldValues: l.oldValues, newValues: l.newValues })));
        const poLogs = auditRes.data.data.items.filter(l => l.entityName === 'PurchaseOrder');
        console.log(`Found ${poLogs.length} audit logs for PurchaseOrder in the last 50 logs.`);
        poLogs.forEach(l => {
            console.log(`- Action: ${l.action}, EntityId: ${l.entityId}`);
        });
    }

    console.log("All tests completed.");
}

runTests();
