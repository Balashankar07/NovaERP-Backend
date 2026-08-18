const http = require('http');

const API_URL = 'http://localhost:5232/api';
let superAdminToken = '';
let warehouseId = '';
let locationId = '';

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
    console.log('--- Starting Warehouse Management Verification ---');
    try {
        // Login as Super Admin
        console.log("Logging in as Super Admin...");
        let loginRes = await makeRequest('POST', '/Auth/login', {
            email: 'balashankar07@gmail.com',
            password: 'Admin@123'
        });
        
        if (loginRes.status !== 200) {
            console.error("Login failed!", loginRes);
            return;
        }
        
        superAdminToken = loginRes.data.data.accessToken;
        console.log("Logged in successfully.");

        // Login as Employee (No Permissions)
        console.log("Logging in as Employee...");
        let empLoginRes = await makeRequest('POST', '/Auth/login', {
            email: 'employee@novaerp.com',
            password: 'Employee@123'
        });
        
        let employeeToken = '';
        if (empLoginRes.status === 200) {
            employeeToken = empLoginRes.data.data.accessToken;
            console.log("Employee logged in successfully.");
        } else {
            console.error("Employee login failed!", empLoginRes);
        }

        // 0. Negative RBAC Test
        console.log("Testing negative RBAC (Employee trying to view warehouses)...");
        let rbacRes = await makeRequest('GET', '/Warehouses', null, employeeToken);
        console.log(`Negative RBAC Test: ${rbacRes.status} (Expected 403)`);

        // 1. Create Default Warehouse
        console.log("Creating default warehouse...");
        let mainWhCode = 'WH-MAIN-' + Date.now();
        let subWhCode = 'WH-SUB-' + Date.now();

        let wh1Res = await makeRequest('POST', '/Warehouses', {
            warehouseCode: mainWhCode,
            warehouseName: 'Main Warehouse',
            isDefault: false // Let the system handle default logic or bypass checking for first run vs nth run
        }, superAdminToken);
        
        console.log(`Create WH-MAIN: ${wh1Res.status}`);
        if(wh1Res.status === 201) {
            warehouseId = wh1Res.data.data.id;
        } else {
            console.error(wh1Res.data);
            // Fallback: If it failed, we fetch the existing default warehouse
            let allWh = await makeRequest('GET', '/Warehouses', null, superAdminToken);
            warehouseId = allWh.data.data.items[0].id;
            console.log("Using existing warehouse:", warehouseId);
        }

        // 2. Try creating another default warehouse (should fail or auto-handle)
        console.log("Creating second default warehouse (expecting failure)...");
        let wh2Res = await makeRequest('POST', '/Warehouses', {
            warehouseCode: 'WH-FAIL-' + Date.now(),
            warehouseName: 'Fail Warehouse',
            isDefault: true
        }, superAdminToken);
        console.log(`Create second default WH: ${wh2Res.status} (Expected 409)`);

        // 3. Create non-default warehouse
        console.log("Creating non-default warehouse...");
        let wh3Res = await makeRequest('POST', '/Warehouses', {
            warehouseCode: subWhCode,
            warehouseName: 'Sub Warehouse',
            isDefault: false
        }, superAdminToken);
        console.log(`Create non-default WH: ${wh3Res.status}`);
        let subWarehouseId = wh3Res.data.data.id;

        // 4. Create Location in Main Warehouse
        console.log("Creating location in main warehouse...");
        let locCode = 'A-1-' + Date.now();
        let locName = 'Aisle A - Rack 1 - ' + Date.now();
        let loc1Res = await makeRequest('POST', '/WarehouseLocations', {
            warehouseId: warehouseId,
            locationCode: locCode,
            locationName: locName,
            zone: 'A'
        }, superAdminToken);
        console.log(`Create Location: ${loc1Res.status}`);
        locationId = loc1Res.data.data.id;

        // 5. Duplicate Location Code in same warehouse (should fail)
        console.log("Creating duplicate location code...");
        let loc2Res = await makeRequest('POST', '/WarehouseLocations', {
            warehouseId: warehouseId,
            locationCode: locCode,
            locationName: locName + '-dup'
        }, superAdminToken);
        console.log(`Create Duplicate Location Code: ${loc2Res.status} (Expected 409)`);

        // 6. Delete Warehouse with Locations (should fail)
        console.log("Deleting warehouse with locations...");
        let delWhRes = await makeRequest('DELETE', `/Warehouses/${warehouseId}`, null, superAdminToken);
        console.log(`Delete WH with locations: ${delWhRes.status} (Expected 400)`);

        // 7. Duplicate Warehouse Code (should fail)
        console.log("Creating warehouse with duplicate code...");
        let dupWhRes = await makeRequest('POST', '/Warehouses', {
            warehouseCode: mainWhCode,
            warehouseName: 'Another Main',
            isDefault: false
        }, superAdminToken);
        console.log(`Create duplicate warehouse code: ${dupWhRes.status} (Expected 409)`);

        // 8. Duplicate Location Name (should fail)
        console.log("Creating location with duplicate name...");
        let dupLocNameRes = await makeRequest('POST', '/WarehouseLocations', {
            warehouseId: warehouseId,
            locationCode: 'A-2-' + Date.now(),
            locationName: locName // Same name as A-1
        }, superAdminToken);
        console.log(`Create duplicate location name: ${dupLocNameRes.status} (Expected 409)`);

        // 9. Deactivating warehouse deactivates its locations
        console.log("Deactivating warehouse...");
        let deactWhRes = await makeRequest('PUT', `/Warehouses/${warehouseId}`, {
            warehouseName: 'Main Warehouse Deactivated',
            isDefault: true,
            isActive: false
        }, superAdminToken);
        // Wait for it to apply if async, but it is sync in db
        console.log(`Deactivate warehouse: ${deactWhRes.status}`);
        
        let locCheckRes = await makeRequest('GET', `/WarehouseLocations/${locationId}`, null, superAdminToken);
        console.log(`Location IsActive after warehouse deactivation: ${locCheckRes.data.data.isActive} (Expected false)`);

        // 10. Test Pagination & Search
        console.log("Testing search...");
        let searchRes = await makeRequest('GET', '/Warehouses?search=Sub', null, superAdminToken);
        console.log(`Search for 'Sub' found: ${searchRes.data.data.items.length} (Expected 1)`);

        // 11. Update Sub Warehouse (To generate Update Audit Log)
        console.log("Updating sub warehouse...");
        let updateSubRes = await makeRequest('PUT', `/Warehouses/${subWarehouseId}`, {
            warehouseName: 'Sub Warehouse Updated',
            isDefault: false,
            isActive: true
        }, superAdminToken);
        console.log(`Update Sub WH: ${updateSubRes.status} (Expected 200)`);

        // 12. Delete Sub Warehouse (should succeed, generating Delete Audit Log)
        console.log("Deleting sub warehouse...");
        let delSubRes = await makeRequest('DELETE', `/Warehouses/${subWarehouseId}`, null, superAdminToken);
        console.log(`Delete Sub WH: ${delSubRes.status} (Expected 200)`);

        // 13. Delete Default Warehouse (should fail)
        console.log("Deleting default warehouse...");
        let defWh = await makeRequest('GET', '/Warehouses', null, superAdminToken);
        let defaultWhId = defWh.data.data.items.find(x => x.isDefault)?.id;
        let delDefRes = await makeRequest('DELETE', `/Warehouses/${defaultWhId}`, null, superAdminToken);
        console.log(`Delete Default WH: ${delDefRes.status} (Expected 400)`);

        // 14. Check Audit Logs for Create, Update, Delete
        console.log("Checking audit logs...");
        let auditRes = await makeRequest('GET', '/AuditLogs?sortBy=timestamp&sortOrder=desc&pageSize=50', null, superAdminToken);
        let whLogs = auditRes.data.data.items.filter(x => x.entityName === 'Warehouse');
        
        let hasCreate = whLogs.some(x => x.action === 'Create');
        let hasUpdate = whLogs.some(x => x.action === 'Update');
        let hasDelete = whLogs.some(x => x.action === 'Delete');
        
        console.log(`Audit Log - Create exists: ${hasCreate}`);
        console.log(`Audit Log - Update exists: ${hasUpdate}`);
        console.log(`Audit Log - Delete exists: ${hasDelete}`);

        console.log('--- Verification Complete ---');
    } catch (error) {
        console.error("Test execution failed:", error);
    }
}

runTests();
