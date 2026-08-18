const http = require('http');

const API_URL = 'http://localhost:5233/api';
let token = '';
let employeeToken = '';

async function request(endpoint, method = 'GET', body = null, overrideToken = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_URL}${endpoint}`);
        const currentToken = overrideToken !== null ? overrideToken : token;
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': currentToken ? `Bearer ${currentToken}` : ''
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let parsed = null;
                if (data) {
                    try {
                        parsed = JSON.parse(data);
                    } catch (e) {
                        parsed = data;
                    }
                }
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
    console.log('--- Starting Supplier API Verification ---');
    try {
        // 1. Login as Super Admin
        console.log('Logging in as Super Admin...');
        const loginRes = await request('/Auth/login', 'POST', {
            email: 'balashankar07@gmail.com',
            password: 'Admin@123'
        });
        if (loginRes.status !== 200 || !loginRes.data.data.accessToken) {
            throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
        }
        token = loginRes.data.data.accessToken;
        console.log('Super Admin Login successful.');
        
        // Let's create an Employee user to test RBAC (403 Forbidden)
        console.log('\n--- Creating Employee User for RBAC testing ---');
        // Get Employee role ID
        const rolesRes = await request('/Role');
        if (!rolesRes.data || !rolesRes.data.data) {
            console.log('Failed to fetch roles:', rolesRes);
        } else {
            let employeeRole = rolesRes.data.data.items.find(r => r.name === 'Employee');
            if (employeeRole) {
                // Get company
                const companyRes = await request('/Company');
                const companyId = companyRes.data.data.items[0].id;
                const createUserRes = await request('/User', 'POST', {
                    firstName: 'Test',
                    lastName: 'Employee',
                    email: 'employee@novaerp.com',
                    phone: '1234567890',
                    password: 'Employee@123',
                    roleId: employeeRole.id,
                    companyId: companyId
                });
                
                console.log('Logging in as Employee...');
                const empLoginRes = await request('/Auth/login', 'POST', {
                    email: 'employee@novaerp.com',
                    password: 'Employee@123'
                });
                if (empLoginRes.status === 200 && empLoginRes.data && empLoginRes.data.data.accessToken) {
                    employeeToken = empLoginRes.data.data.accessToken;
                    console.log('Employee Login successful.');
                } else {
                    console.log('Employee Login failed:', empLoginRes.data);
                }
            }
        }

        // 2. Test Suppliers CRUD
        console.log('\n--- Testing Suppliers CRUD ---');
        
        // Create
        let res = await request('/Suppliers', 'POST', {
            supplierCode: 'SUP-001',
            supplierName: 'Acme Corp',
            companyName: 'Acme Corporation',
            contactPerson: 'John Doe',
            email: 'john@acme.com',
            phone: '555-0100',
            city: 'New York',
            country: 'USA'
        });
        console.log('Create Supplier (Super Admin):', res.status, res.data?.message);
        if (!res.data || !res.data.data) throw new Error('Create Supplier failed');
        let supplierId = res.data.data.id;

        // RBAC Check (403)
        if (employeeToken) {
            let rbacRes = await request(`/Suppliers/${supplierId}`, 'GET', null, employeeToken);
            console.log('RBAC Check (Employee GET):', rbacRes.status);
            
            rbacRes = await request('/Suppliers', 'POST', {
                supplierCode: 'SUP-002',
                supplierName: 'Hack Corp'
            }, employeeToken);
            console.log('RBAC Check (Employee POST):', rbacRes.status);
        }
        
        // RBAC Check (401)
        let unauthRes = await request(`/Suppliers`, 'GET', null, '');
        console.log('RBAC Check (Unauthorized GET):', unauthRes.status);

        // Update
        res = await request(`/Suppliers/${supplierId}`, 'PUT', {
            supplierCode: 'SUP-001',
            supplierName: 'Acme Corp Updated',
            companyName: 'Acme Corporation',
            contactPerson: 'Jane Doe',
            email: 'jane@acme.com',
            phone: '555-0200',
            city: 'Boston',
            country: 'USA',
            isActive: true
        });
        console.log('Update Supplier (Super Admin):', res.status, res.data?.message);

        // GetAll with Pagination, Search, Sorting
        console.log('\n--- Testing Pagination, Search, Sorting ---');
        // Add another supplier for better testing
        await request('/Suppliers', 'POST', {
            supplierCode: 'SUP-002',
            supplierName: 'Globex Inc',
            city: 'Springfield'
        });
        
        res = await request('/Suppliers?pageNumber=1&pageSize=1&sortBy=supplierName&sortOrder=asc');
        console.log('GetAll (Page 1, Size 1, Sort Asc):', res.status, `Count: ${res.data.data.items.length}, First: ${res.data.data.items[0].supplierName}, Total: ${res.data.data.totalCount}`);

        res = await request('/Suppliers?pageNumber=2&pageSize=1&sortBy=supplierName&sortOrder=asc');
        console.log('GetAll (Page 2, Size 1, Sort Asc):', res.status, `Count: ${res.data.data.items.length}, First: ${res.data.data.items[0].supplierName}, Total: ${res.data.data.totalCount}`);

        res = await request('/Suppliers?search=Globex');
        console.log('GetAll (Search "Globex"):', res.status, `Count: ${res.data.data.items.length}, First: ${res.data.data.items[0].supplierName}`);

        // 3. Delete
        console.log('\n--- Testing Deletion ---');
        res = await request(`/Suppliers/${supplierId}`, 'DELETE');
        console.log('Delete Supplier 1:', res.status);
        
        const allSuppliers = await request('/Suppliers');
        for (let s of allSuppliers.data.data.items) {
            await request(`/Suppliers/${s.id}`, 'DELETE');
        }
        
        // 4. Verify Audit Logs
        console.log('\n--- Testing Audit Logs ---');
        res = await request('/AuditLogs?pageNumber=1&pageSize=50');
        console.log('Sample audit log:', res.data.data.items[0]);
        const supplierLogs = res.data.data.items.filter(l => l.entityName === 'Supplier');
        console.log(`Found ${supplierLogs.length} audit logs for Supplier in the last 50 logs.`);
        supplierLogs.forEach(l => console.log(`- Action: ${l.action}, EntityId: ${l.entityId}`));

        console.log('\nAll tests completed.');
    } catch (e) {
        console.error('Error during testing:', e.message);
    }
}

runTests();
