const {Client} = require('pg');
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
    console.log('=== Backend Shortage Enforcement Tests ===\n');
    const c = new Client('postgresql://postgres:balan123@localhost:5432/NovaERPDB');
    try {
        await c.connect();
        await c.query('DELETE FROM "Inventories"');
        
        let loginRes = await makeRequest('POST', '/Auth/login', { email: 'balashankar07@gmail.com', password: 'Admin@123' });
        if (loginRes.status !== 200) throw new Error('Login failed: ' + JSON.stringify(loginRes));
        token = loginRes.data.data.accessToken;
        console.log('✅ Authenticated.');

        let whResult = await c.query('SELECT "Id" FROM "Warehouses" LIMIT 1');
        let whId = whResult.rows[0].Id;

        const bomItems = [
            { RawMaterialProductId: 'a37ccb67-92ae-4b1a-9ddc-a55cbd87752d', Quantity: 3 },
            { RawMaterialProductId: '37b5a73c-b400-4ad1-b825-85099b885583', Quantity: 6 },
            { RawMaterialProductId: 'c67125ef-4d70-4b5e-b118-57aa70b0377f', Quantity: 1 },
            { RawMaterialProductId: 'df5e2e2d-014b-448b-ade8-0c8263cacb6b', Quantity: 1 },
            { RawMaterialProductId: '5c4c27c8-125b-4a86-9e6c-beb66d5cd56f', Quantity: 1 },
            { RawMaterialProductId: 'd4a4f451-2034-4bcd-9eb0-b9fbcab1e258', Quantity: 2 },
            { RawMaterialProductId: '4a8f13ad-8f4f-4ee5-b887-ff406b2395dd', Quantity: 1 },
            { RawMaterialProductId: '2546cd49-5837-440f-89d6-c48decb62695', Quantity: 1 },
            { RawMaterialProductId: '8250ae81-b2b6-4593-bc2c-65924e7892f3', Quantity: 1 }
        ];

        for (let item of bomItems) {
            await c.query(`INSERT INTO "Inventories" ("Id", "ProductId", "WarehouseId", "QuantityAvailable", "CreatedAt", "LastStockUpdate", "IsActive") VALUES (gen_random_uuid(), '${item.RawMaterialProductId}', '${whId}', ${item.Quantity}, NOW(), NOW(), true)`);
        }
        
        let fgId = '0991b218-6136-4094-a3d8-337f4f87fed4';
        
        console.log('\n--- TEST A: quantity = 10, insufficient stock ---');
        let planARes = await makeRequest('POST', '/ProductionPlans', {
            productId: fgId, plannedQuantity: 10, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        let planAId = planARes.data.data.id;
        let releaseARes = await makeRequest('POST', `/ProductionPlans/${planAId}/release`);
        assert(releaseARes.status === 400, 'Release A rejected');
        assert(releaseARes.data.message.toLowerCase().includes('insufficient'), 'Shortage error message returned');
        assert(releaseARes.data.data.shortages && releaseARes.data.data.shortages.length > 0, 'Structured shortage data returned');
        let planACheck = await makeRequest('GET', `/ProductionPlans/${planAId}`);
        assert(planACheck.data.data.status === 'Draft' || planACheck.data.data.status === 1, 'Plan A status unchanged');
        
        console.log('\n--- TEST B: quantity = 999999, insufficient stock ---');
        let planBRes = await makeRequest('POST', '/ProductionPlans', {
            productId: fgId, plannedQuantity: 999999, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        let planBId = planBRes.data.data.id;
        let releaseBRes = await makeRequest('POST', `/ProductionPlans/${planBId}/release`);
        assert(releaseBRes.status === 400, 'Release B rejected');
        assert(releaseBRes.data.data.shortages && releaseBRes.data.data.shortages.length > 0, 'Shortages returned for B');
        let planBCheck = await makeRequest('GET', `/ProductionPlans/${planBId}`);
        assert(planBCheck.data.data.status === 'Draft' || planBCheck.data.data.status === 1, 'Plan B status unchanged');
        
        console.log('\n--- TEST C: quantity = 1, sufficient stock ---');
        let planCRes = await makeRequest('POST', '/ProductionPlans', {
            productId: fgId, plannedQuantity: 1, plannedStartDate: new Date().toISOString(), plannedEndDate: new Date().toISOString(), priority: 2
        });
        let planCId = planCRes.data.data.id;
        let releaseCRes = await makeRequest('POST', `/ProductionPlans/${planCId}/release`);
        assert(releaseCRes.status === 200, 'Release C succeeds');
        let planCCheck = await makeRequest('GET', `/ProductionPlans/${planCId}`);
        assert(planCCheck.data.data.status === 'Released' || planCCheck.data.data.status === 2, 'Plan C status = Released');
        
        console.log('\n--- TEST D: Direct API release request bypassing any frontend ---');
        console.log('✅ TEST D is implicitly verified since all these requests are made via direct API calls bypassing the frontend.');

        console.log('\n✅ ALL TESTS PASSED.');
        await c.end();
        process.exit(0);
    } catch (err) {
        console.error(err);
        await c.end();
        process.exit(1);
    }
}
runTests();
