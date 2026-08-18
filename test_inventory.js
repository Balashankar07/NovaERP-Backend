const http = require('http');

const API_URL = 'http://localhost:5233/api';
let superAdminToken = '';
let employeeToken = '';

async function makeRequest(method, endpoint, body = null, token = null) {
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

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log('=== Inventory Module Verification ===\n');

    try {
        // 1. Login
        console.log('1. Authentication...');
        let loginRes = await makeRequest('POST', '/Auth/login', {
            email: 'balashankar07@gmail.com', password: 'Admin@123'
        });
        if (loginRes.status !== 200) { console.error('Login failed!', loginRes.data); return; }
        superAdminToken = loginRes.data.data.accessToken;
        console.log(`   Super Admin login: ${loginRes.status} ✓`);

        let empLoginRes = await makeRequest('POST', '/Auth/login', {
            email: 'employee@novaerp.com', password: 'Employee@123'
        });
        if (empLoginRes.status === 200) {
            employeeToken = empLoginRes.data.data.accessToken;
            console.log(`   Employee login: ${empLoginRes.status} ✓`);
        }

        // 2. RBAC - Negative test
        console.log('\n2. RBAC - Negative test (Employee)...');
        let rbacRes = await makeRequest('GET', '/Inventory', null, employeeToken);
        console.log(`   GET /Inventory without permission: ${rbacRes.status} (Expected 403) ${rbacRes.status === 403 ? '✓' : '✗'}`);

        // 3. GET all inventory (should be empty initially or contain data from prior GRNs)
        console.log('\n3. GET all inventory...');
        let allInvRes = await makeRequest('GET', '/Inventory?pageNumber=1&pageSize=10', null, superAdminToken);
        console.log(`   GET /Inventory: ${allInvRes.status} (Expected 200) ${allInvRes.status === 200 ? '✓' : '✗'}`);
        if (allInvRes.status === 200) {
            const inv = allInvRes.data.data;
            console.log(`   TotalCount: ${inv.totalCount}, Items: ${inv.items.length}`);
            console.log(`   Pagination fields present: ${inv.totalCount !== undefined && inv.pageNumber !== undefined ? '✓' : '✗'}`);
        }

        // 4. Search
        console.log('\n4. Search test...');
        let searchRes = await makeRequest('GET', '/Inventory?search=test&pageNumber=1&pageSize=5', null, superAdminToken);
        console.log(`   GET /Inventory?search=test: ${searchRes.status} (Expected 200) ${searchRes.status === 200 ? '✓' : '✗'}`);

        // 5. Sort
        console.log('\n5. Sort test...');
        let sortRes = await makeRequest('GET', '/Inventory?sortBy=quantityonhand&sortOrder=desc', null, superAdminToken);
        console.log(`   GET /Inventory?sortBy=quantityonhand&sortOrder=desc: ${sortRes.status} (Expected 200) ${sortRes.status === 200 ? '✓' : '✗'}`);

        // 6. Get by product (use a random non-existent ID to verify endpoint exists)
        console.log('\n6. GET by product...');
        let byProductRes = await makeRequest('GET', `/Inventory/by-product/00000000-0000-0000-0000-000000000001`, null, superAdminToken);
        console.log(`   GET /Inventory/by-product/{id}: ${byProductRes.status} (Expected 200 with empty array) ${byProductRes.status === 200 ? '✓' : '✗'}`);

        // 7. Get by warehouse
        console.log('\n7. GET by warehouse...');
        // First get a real warehouse ID
        let whRes = await makeRequest('GET', '/Warehouses?pageNumber=1&pageSize=1', null, superAdminToken);
        if (whRes.status === 200 && whRes.data.data.items.length > 0) {
            const whId = whRes.data.data.items[0].id;
            let byWhRes = await makeRequest('GET', `/Inventory/by-warehouse/${whId}?pageNumber=1&pageSize=10`, null, superAdminToken);
            console.log(`   GET /Inventory/by-warehouse/{id}: ${byWhRes.status} (Expected 200) ${byWhRes.status === 200 ? '✓' : '✗'}`);
        } else {
            console.log('   No warehouses found - skipping by-warehouse test');
        }

        // 8. Check GRN→Inventory integration — find a completed GRN
        console.log('\n8. GRN → Inventory Integration...');
        let grnRes = await makeRequest('GET', '/GoodsReceipts?pageNumber=1&pageSize=50', null, superAdminToken);
        if (grnRes.status === 200) {
            const completedGrn = grnRes.data.data.items.find(g => g.status === 'Completed');
            if (completedGrn) {
                console.log(`   Found completed GRN: ${completedGrn.grnNumber}`);
                // Check if inventory exists for this GRN
                let invAfterGrn = await makeRequest('GET', `/Inventory?pageNumber=1&pageSize=100`, null, superAdminToken);
                if (invAfterGrn.status === 200) {
                    const count = invAfterGrn.data.data.totalCount;
                    console.log(`   Inventory records present: ${count} ${count > 0 ? '✓' : '⚠ (no GRN completed yet)'}`);
                }
            } else {
                console.log('   ⚠ No completed GRN found - trigger a GRN completion to verify inventory integration');
            }
        }

        // 9. If any inventory records exist, test transactions endpoint
        console.log('\n9. Transactions endpoint...');
        let invRes = await makeRequest('GET', '/Inventory?pageNumber=1&pageSize=1', null, superAdminToken);
        if (invRes.status === 200 && invRes.data.data.items.length > 0) {
            const invId = invRes.data.data.items[0].id;
            let txRes = await makeRequest('GET', `/Inventory/${invId}/transactions?pageNumber=1&pageSize=10`, null, superAdminToken);
            console.log(`   GET /Inventory/{id}/transactions: ${txRes.status} (Expected 200) ${txRes.status === 200 ? '✓' : '✗'}`);
            if (txRes.status === 200) {
                console.log(`   Transactions: ${txRes.data.data.totalCount}`);
            }
        } else {
            // Still verify the endpoint exists with a fake ID
            let txRes = await makeRequest('GET', `/Inventory/00000000-0000-0000-0000-000000000001/transactions`, null, superAdminToken);
            console.log(`   GET /Inventory/{id}/transactions: ${txRes.status} (Expected 200) ${txRes.status === 200 ? '✓' : '✗'}`);
        }

        // 10. Transactions RBAC
        console.log('\n10. Transactions RBAC...');
        let txRbacRes = await makeRequest('GET', '/Inventory/00000000-0000-0000-0000-000000000001/transactions', null, employeeToken);
        console.log(`    Transactions without permission: ${txRbacRes.status} (Expected 403) ${txRbacRes.status === 403 ? '✓' : '✗'}`);

        // 11. GET by ID not found
        console.log('\n11. 404 test...');
        let notFoundRes = await makeRequest('GET', '/Inventory/00000000-0000-0000-0000-000000000001', null, superAdminToken);
        console.log(`    GET /Inventory/{nonexistent}: ${notFoundRes.status} (Expected 404) ${notFoundRes.status === 404 ? '✓' : '✗'}`);

        console.log('\n=== Verification Complete ===');

    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

runTests();
