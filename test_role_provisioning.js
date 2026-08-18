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
    console.log('=== Role Provisioning & Validation Verification ===\n');
    try {
        // TEST A: Login
        let loginRes = await makeRequest('POST', '/Auth/login', { email: 'balashankar07@gmail.com', password: 'Admin@123' });
        assert(loginRes.status === 200, 'TEST A: Admin login succeeds');
        token = loginRes.data.data.accessToken;

        // Fetch Roles
        let rolesRes = await makeRequest('GET', '/Role?pageSize=100');
        if (!rolesRes.data || !rolesRes.data.data) {
            console.error('Failed to fetch roles', rolesRes);
            process.exit(1);
        }
        let roles = rolesRes.data.data.items || rolesRes.data.data;
        if (!Array.isArray(roles)) {
             console.error('Roles is not array', rolesRes);
             process.exit(1);
        }
        
        let getRole = name => roles.find(r => r.name === name);
        
        const procurementManager = getRole('Procurement Manager');
        const qualityEngineer = getRole('Quality Engineer');
        const salesManager = getRole('Sales Manager');
        const financeManager = getRole('Finance Manager');
        const warrantyExecutive = getRole('Warranty Executive');
        const warehouseManager = getRole('Warehouse Manager');
        
        assert(procurementManager && qualityEngineer && salesManager, 'Roles loaded from database');
        
        // Assert Role Readiness Metadata
        assert(procurementManager.isOperationallyReady === true, 'Procurement Manager is operationally ready');
        assert(qualityEngineer.isOperationallyReady === false, 'Quality Engineer is NOT operationally ready');
        
        const now = Date.now();
        
        let userRes = await makeRequest('GET', '/User?pageSize=1');
        let companyId = userRes.data.data.items[0].companyId;
        
        console.log('\n--- Scenario: Create Operational User ---');
        // TEST B
        let createRes = await makeRequest('POST', '/User', {
            firstName: 'Pro',
            lastName: 'Manager',
            email: `procurement.manager.${now}@test.com`,
            companyId: companyId,
            roleIds: [procurementManager.id]
        });
        if (createRes.status !== 201 && createRes.status !== 200) {
            console.error('Create failed', createRes.status, createRes.data);
        }
        assert(createRes.status === 201 || createRes.status === 200, 'TEST B: Admin creates active Procurement Manager');
        let newUserId = createRes.data.data.id;
        
        // TEST C
        let listRes = await makeRequest('GET', `/User/${newUserId}`);
        assert(listRes.status === 200, 'TEST C: Newly created user appears in Users list / can be fetched');
        assert(listRes.data.data.assignedRoles.some(r => r.roleName === 'Procurement Manager'), 'User assigned Procurement Manager role');
        
        console.log('\n--- Scenario: Create Non-Operational Users (Should Fail) ---');
        
        // TEST H
        let failQERes = await makeRequest('POST', '/User', {
            firstName: 'Quality', lastName: 'Eng', email: `qe.${now}@test.com`,
            companyId: companyId, roleIds: [qualityEngineer.id]
        });
        assert(failQERes.status === 400 || failQERes.status === 409 || failQERes.status === 500, 'TEST H: Admin attempts to create Quality Engineer -> Backend rejects');
        
        // TEST I
        let failSalesRes = await makeRequest('POST', '/User', {
            firstName: 'Sales', lastName: 'Mgr', email: `sales.${now}@test.com`,
            companyId: companyId, roleIds: [salesManager.id]
        });
        assert(failSalesRes.status === 400 || failSalesRes.status === 409 || failSalesRes.status === 500, 'TEST I: Admin attempts to create Sales Manager -> Backend rejects');
        
        // TEST J
        let failFinRes = await makeRequest('POST', '/User', {
            firstName: 'Finance', lastName: 'Mgr', email: `fin.${now}@test.com`,
            companyId: companyId, roleIds: [financeManager.id]
        });
        assert(failFinRes.status === 400 || failFinRes.status === 409 || failFinRes.status === 500, 'TEST J: Admin attempts to create Finance Manager -> Backend rejects');
        
        // TEST K
        let failWarrantyRes = await makeRequest('POST', '/User', {
            firstName: 'Warranty', lastName: 'Exec', email: `war.${now}@test.com`,
            companyId: companyId, roleIds: [warrantyExecutive.id]
        });
        assert(failWarrantyRes.status === 400 || failWarrantyRes.status === 409 || failWarrantyRes.status === 500, 'TEST K: Admin attempts to create Warranty Exec -> Backend rejects');
        
        console.log('\n--- Scenario: Update User Role ---');
        // TEST L & M indirectly: Changing role.
        let updateRes = await makeRequest('PUT', `/User/${newUserId}`, {
            firstName: 'Pro',
            lastName: 'Manager',
            phone: '',
            companyId: companyId,
            roleIds: [warehouseManager.id], // Change to Warehouse Manager
            isActive: true
        });
        assert(updateRes.status === 200 || updateRes.status === 204, 'Admin changes Procurement Manager to Warehouse Manager');
        
        let verifyUpdate = await makeRequest('GET', `/User/${newUserId}`);
        assert(verifyUpdate.data.data.assignedRoles.some(r => r.roleName === 'Warehouse Manager'), 'Role successfully changed to Warehouse Manager');
        assert(!verifyUpdate.data.data.assignedRoles.some(r => r.roleName === 'Procurement Manager'), 'Old role removed');
        
        // Clean up
        await makeRequest('DELETE', `/User/${newUserId}`);
        
        console.log('\n✅ ALL ROLE PROVISIONING VERIFICATIONS PASSED.');
    } catch (err) {
        console.error(err);
    }
}
runTests();
