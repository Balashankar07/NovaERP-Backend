const http = require('http');

const API_URL = 'http://localhost:5232/api';
let token = '';

async function request(endpoint, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_URL}${endpoint}`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
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
    console.log('--- Starting API Verification ---');
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await request('/Auth/login', 'POST', {
            email: 'balashankar07@gmail.com',
            password: 'Admin@123'
        });
        if (loginRes.status !== 200 || !loginRes.data.data.accessToken) {
            throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
        }
        token = loginRes.data.data.accessToken;
        console.log('Login successful.');

        // 2. Test Product Categories
        console.log('\n--- Testing Product Categories ---');
        let res = await request('/ProductCategories', 'POST', {
            name: 'Test Category',
            description: 'Test Desc'
        });
        console.log('Create:', res.status, res.data);
        if (!res.data || !res.data.data) throw new Error('Create Category failed');
        let categoryId = res.data.data.id;

        res = await request(`/ProductCategories/${categoryId}`, 'PUT', {
            name: 'Updated Category',
            description: 'Test Desc',
            isActive: true
        });
        console.log('Update:', res.status, res.data.message);

        res = await request('/ProductCategories?pageNumber=1&pageSize=10&search=Updated&sortBy=name&sortOrder=desc');
        console.log('GetAll (with filters):', res.status, `Count: ${res.data.data.items.length}`);

        // 3. Test Brands
        console.log('\n--- Testing Brands ---');
        res = await request('/Brands', 'POST', {
            name: 'Test Brand',
            description: 'Test Desc'
        });
        console.log('Create:', res.status, res.data.message);
        let brandId = res.data.data.id;

        res = await request(`/Brands/${brandId}`, 'PUT', {
            name: 'Updated Brand',
            description: 'Test Desc',
            isActive: true
        });
        console.log('Update:', res.status, res.data.message);

        res = await request('/Brands?pageNumber=1&pageSize=10&search=Updated&sortBy=name&sortOrder=desc');
        console.log('GetAll (with filters):', res.status, `Count: ${res.data.data.items.length}`);

        // 4. Test Units
        console.log('\n--- Testing Units ---');
        res = await request('/Units', 'POST', {
            name: 'Test Unit',
            abbreviation: 'TU',
            description: 'Test Desc'
        });
        console.log('Create:', res.status, res.data.message);
        let unitId = res.data.data.id;

        res = await request(`/Units/${unitId}`, 'PUT', {
            name: 'Updated Unit',
            abbreviation: 'UU',
            description: 'Test Desc',
            isActive: true
        });
        console.log('Update:', res.status, res.data.message);

        res = await request('/Units?pageNumber=1&pageSize=10&search=Updated&sortBy=name&sortOrder=desc');
        console.log('GetAll (with filters):', res.status, `Count: ${res.data.data.items.length}`);

        // 5. Test Products
        console.log('\n--- Testing Products ---');
        res = await request('/Products', 'POST', {
            productCode: 'PROD-001',
            sku: 'SKU-001',
            name: 'Test Product',
            description: 'Test Desc',
            categoryId: categoryId,
            brandId: brandId,
            unitId: unitId,
            costPrice: 100.0,
            sellingPrice: 150.0,
            minimumStock: 10,
            maximumStock: 100,
            reorderLevel: 20
        });
        console.log('Create:', res.status, res.data.message);
        let productId = res.data.data.id;
        
        // FK constraint check
        res = await request('/Products', 'POST', {
            productCode: 'PROD-002',
            sku: 'SKU-002',
            name: 'Test Product FK Fail',
            categoryId: '00000000-0000-0000-0000-000000000000', // invalid
            brandId: brandId,
            unitId: unitId,
            costPrice: 100.0,
            sellingPrice: 150.0,
            minimumStock: 10,
            maximumStock: 100,
            reorderLevel: 20
        });
        console.log('Create (FK Fail Check):', res.status, res.data.message);

        res = await request(`/Products/${productId}`, 'PUT', {
            productCode: 'PROD-001',
            sku: 'SKU-001',
            name: 'Updated Product',
            description: 'Test Desc',
            categoryId: categoryId,
            brandId: brandId,
            unitId: unitId,
            costPrice: 120.0,
            sellingPrice: 160.0,
            minimumStock: 10,
            maximumStock: 100,
            reorderLevel: 20,
            isActive: true
        });
        console.log('Update:', res.status, res.data.message);

        res = await request('/Products?pageNumber=1&pageSize=10&search=Updated&sortBy=name&sortOrder=desc');
        console.log('GetAll (with filters):', res.status, `Count: ${res.data.data.items.length}`);

        // 5.5 Test BOMs
        console.log('\n--- Testing BOMs ---');
        res = await request('/BOMs', 'POST', {
            productId: productId,
            version: 'v1.0',
            description: 'First BOM version',
            isActive: true,
            items: [
                {
                    rawMaterialProductId: productId, // self reference just for test
                    quantity: 5.0,
                    unitId: unitId,
                    wastePercentage: 2.5,
                    remarks: 'Requires careful handling'
                }
            ]
        });
        console.log('Create BOM:', res.status, res.data?.message);
        if (!res.data || !res.data.data) throw new Error('Create BOM failed: ' + JSON.stringify(res.data));
        let bomId = res.data.data.id;

        res = await request(`/BOMs/${bomId}`, 'PUT', {
            version: 'v1.1',
            description: 'Updated BOM version',
            isActive: true,
            items: [
                {
                    rawMaterialProductId: productId,
                    quantity: 10.0,
                    unitId: unitId,
                    wastePercentage: 1.5,
                    remarks: 'Updated remarks'
                }
            ]
        });
        console.log('Update BOM:', res.status, res.data.message);

        res = await request('/BOMs?pageNumber=1&pageSize=10&search=v1.1&sortOrder=desc');
        console.log('GetAll BOMs (with filters):', res.status, `Count: ${res.data.data.items.length}`);

        // 6. Delete Everything
        console.log('\n--- Testing Deletion ---');
        res = await request(`/BOMs/${bomId}`, 'DELETE');
        console.log('Delete BOM:', res.status);
        res = await request(`/Products/${productId}`, 'DELETE');
        console.log('Delete Product:', res.status);
        res = await request(`/ProductCategories/${categoryId}`, 'DELETE');
        console.log('Delete Category:', res.status);
        res = await request(`/Brands/${brandId}`, 'DELETE');
        console.log('Delete Brand:', res.status);
        res = await request(`/Units/${unitId}`, 'DELETE');
        console.log('Delete Unit:', res.status);
        
        // 7. Verify Audit Logs
        console.log('\n--- Testing Audit Logs ---');
        res = await request('/AuditLogs?pageNumber=1&pageSize=50');
        console.log('Audit Logs count:', res.data.data.items.length);

        console.log('\nAll tests completed.');
    } catch (e) {
        console.error('Error during testing:', e.message);
    }
}

runTests();
