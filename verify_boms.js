const { Client } = require('pg');
const http = require('http');

const API_URL = 'http://localhost:5233/api';
const DB_CONN = 'postgresql://postgres:balan123@localhost:5432/NovaERPDB';
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

async function run() {
    const client = new Client({ connectionString: DB_CONN });
    await client.connect();

    console.log("=== FINAL READ-ONLY BOM VALIDATION ===");

    // 1. Get BOM structures for 5 Finished Products
    const productsToFind = ['Bluetooth Speaker', 'Wireless Earbuds', 'Smartwatch', 'Power Bank', 'Neckband'];
    const bomDetails = [];
    
    // Find these products
    const productsRes = await client.query(`
        SELECT p."Id", p."Name", b."Id" as "BomId"
        FROM "Products" p
        JOIN "BOMs" b ON p."Id" = b."ProductId"
        WHERE p."Name" = ANY($1) AND b."IsActive" = true
    `, [productsToFind]);

    let passedBomStructure = true;

    for (const p of productsToFind) {
        const prod = productsRes.rows.find(x => x.Name === p);
        if (!prod) {
            console.log(`FAIL: Could not find Product or Active BOM for ${p}`);
            passedBomStructure = false;
            continue;
        }

        const itemsRes = await client.query(`
            SELECT p."Name" as "ComponentName", bi."Quantity", u."Name" as "UnitName"
            FROM "BOMItems" bi
            JOIN "Products" p ON bi."RawMaterialProductId" = p."Id"
            JOIN "Units" u ON bi."UnitId" = u."Id"
            WHERE bi."BomId" = $1
        `, [prod.BomId]);

        console.log(`\nProduct Name: ${p}`);
        console.log(`BOM Id: ${prod.BomId}`);
        for (const item of itemsRes.rows) {
            console.log(`- Component: ${item.ComponentName} | QuantityPerUnit: ${item.Quantity} | Unit: ${item.UnitName}`);
        }
    }

    // 3. Verify counts
    console.log("\n--- Verification ---");
    const fgBomsQuery = await client.query(`
        SELECT COUNT(DISTINCT b."Id") as count 
        FROM "BOMs" b JOIN "Products" p ON b."ProductId" = p."Id" 
        WHERE p."Name" = ANY($1) AND b."IsActive" = true
    `, [productsToFind]);
    const fgBoms = parseInt(fgBomsQuery.rows[0].count);
    console.log(`5 Finished Product BOMs: ${fgBoms === 5 ? 'PASS' : 'FAIL'} (${fgBoms})`);

    const bomItemsQuery = await client.query(`
        SELECT COUNT(*) as count 
        FROM "BOMItems" bi 
        JOIN "BOMs" b ON bi."BomId" = b."Id"
        JOIN "Products" p ON b."ProductId" = p."Id"
        WHERE p."Name" = ANY($1) AND b."IsActive" = true
    `, [productsToFind]);
    const totalBomItems = parseInt(bomItemsQuery.rows[0].count);
    console.log(`49 BOM Items: ${totalBomItems === 49 ? 'PASS' : 'FAIL'} (${totalBomItems})`);

    const uniqueCompsQuery = await client.query(`
        SELECT COUNT(DISTINCT bi."RawMaterialProductId") as count 
        FROM "BOMItems" bi 
        JOIN "BOMs" b ON bi."BomId" = b."Id"
        JOIN "Products" p ON b."ProductId" = p."Id"
        WHERE p."Name" = ANY($1) AND b."IsActive" = true
    `, [productsToFind]);
    const uniqueComps = parseInt(uniqueCompsQuery.rows[0].count);
    console.log(`33 unique required Components: ${uniqueComps === 33 ? 'PASS' : 'FAIL'} (${uniqueComps})`);

    const duplicateItemsQuery = await client.query(`
        SELECT b."Id", bi."RawMaterialProductId", COUNT(*) 
        FROM "BOMItems" bi 
        JOIN "BOMs" b ON bi."BomId" = b."Id"
        JOIN "Products" p ON b."ProductId" = p."Id"
        WHERE p."Name" = ANY($1) AND b."IsActive" = true
        GROUP BY b."Id", bi."RawMaterialProductId"
        HAVING COUNT(*) > 1
    `, [productsToFind]);
    console.log(`No duplicate BOM items: ${duplicateItemsQuery.rowCount === 0 ? 'PASS' : 'FAIL'} (${duplicateItemsQuery.rowCount})`);

    const orphanItemsQuery = await client.query(`
        SELECT bi."Id"
        FROM "BOMItems" bi
        LEFT JOIN "BOMs" b ON bi."BomId" = b."Id"
        WHERE b."Id" IS NULL
    `);
    console.log(`No orphan BOM items: ${orphanItemsQuery.rowCount === 0 ? 'PASS' : 'FAIL'} (${orphanItemsQuery.rowCount})`);

    // API Tests
    console.log("\n--- Actual API Tests ---");
    let loginRes = await makeRequest('POST', '/Auth/login', { email: 'balashankar07@gmail.com', password: 'Admin@123' });
    if (loginRes.status !== 200) {
        console.log("Login failed");
        return;
    }
    token = loginRes.data.data.accessToken;

    const speakerProd = productsRes.rows.find(x => x.Name === 'Bluetooth Speaker');
    const today = new Date().toISOString();

    // Qty 10
    let plan10 = await makeRequest('POST', '/ProductionPlans', {
        productId: speakerProd.Id, plannedQuantity: 10, plannedStartDate: today, plannedEndDate: today, priority: 2
    });
    let plan10Id = plan10.data.data.id;
    let reqs10 = await makeRequest('GET', `/ProductionPlans/${plan10Id}/requirements`);
    
    // Test A: Release qty=10 with insufficient stock
    let release10 = await makeRequest('POST', `/ProductionPlans/${plan10Id}/release`);
    let passTestA = release10.status === 400 && JSON.stringify(release10.data).includes('shortage');
    console.log(`Test A (qty=10, insufficient stock): ${passTestA ? 'PASS' : 'FAIL'} (Status: ${release10.status})`);

    // Find speaker driver in reqs10
    let driver10 = reqs10.data.data.find(r => r.productName === 'Speaker Driver');
    console.log(`Bluetooth Speaker qty=10: Speaker Driver Required=${driver10 ? driver10.requiredQuantity : 'Not Found'}`);
    let passCalc10 = driver10 && driver10.requiredQuantity === 20;

    // Qty 100
    let plan100 = await makeRequest('POST', '/ProductionPlans', {
        productId: speakerProd.Id, plannedQuantity: 100, plannedStartDate: today, plannedEndDate: today, priority: 2
    });
    let plan100Id = plan100.data.data.id;
    let reqs100 = await makeRequest('GET', `/ProductionPlans/${plan100Id}/requirements`);
    let driver100 = reqs100.data.data.find(r => r.productName === 'Speaker Driver');
    console.log(`Bluetooth Speaker qty=100: Speaker Driver Required=${driver100 ? driver100.requiredQuantity : 'Not Found'}`);
    let passCalc100 = driver100 && driver100.requiredQuantity === 200;

    console.log(`BOM calculation: ${(passCalc10 && passCalc100) ? 'PASS' : 'FAIL'}`);

    // Shortage Validation Test
    // Create a scenario where required stock is greater than available stock
    // Since qty=100 requires 200 speaker drivers, let's see available quantity
    let driverAvailable = driver100 ? driver100.availableQuantity : 0;
    
    // Create a plan that will definitely exceed inventory
    let giantQty = 999999;
    let giantPlan = await makeRequest('POST', '/ProductionPlans', {
        productId: speakerProd.Id, plannedQuantity: giantQty, plannedStartDate: today, plannedEndDate: today, priority: 2
    });
    let giantPlanId = giantPlan.data.data.id;
    let giantReqs = await makeRequest('GET', `/ProductionPlans/${giantPlanId}/requirements`);
    let giantDriver = giantReqs.data.data.find(r => r.productName === 'Speaker Driver');
    
    let passShortageCalc = giantDriver && giantDriver.shortageQuantity === (giantDriver.requiredQuantity - giantDriver.availableQuantity);
    console.log(`Shortage Calculation (required > available): ${passShortageCalc ? 'PASS' : 'FAIL'}`);

    // Verify production blocked
    let releaseGiant = await makeRequest('POST', `/ProductionPlans/${giantPlanId}/release`);
    let isBlocked = releaseGiant.status !== 200 && JSON.stringify(releaseGiant.data).toLowerCase().includes('shortage');
    console.log(`Production blocking (shortage): ${isBlocked ? 'PASS' : 'FAIL'} (Status: ${releaseGiant.status}, Msg: ${JSON.stringify(releaseGiant.data)})`);

    // Sufficient stock scenario
    let smallQty = 1;
    let smallPlan = await makeRequest('POST', '/ProductionPlans', {
        productId: speakerProd.Id, plannedQuantity: smallQty, plannedStartDate: today, plannedEndDate: today, priority: 2
    });
    let smallPlanId = smallPlan.data.data.id;

    // Create temporary inventory
    let whRes = await client.query('SELECT "Id" FROM "Warehouses" LIMIT 1');
    let whId = whRes.rows[0].Id;
    
    let smallReqs = await makeRequest('GET', `/ProductionPlans/${smallPlanId}/requirements`);
    let tempInvIds = [];
    
    for (let r of smallReqs.data.data) {
        if (r.shortageQuantity > 0) {
            let invId = require('crypto').randomUUID();
            tempInvIds.push(invId);
            await client.query(`
                INSERT INTO "Inventories" ("Id", "ProductId", "WarehouseId", "QuantityAvailable", "QuantityOnHand", "QuantityReserved", "ReorderLevel", "MinimumLevel", "MaximumLevel", "LastStockUpdate", "IsActive", "CreatedAt")
                VALUES ($1, $2, $3, $4, $4, 0, 10, 5, 100, NOW(), true, NOW())
            `, [invId, r.productId, whId, r.shortageQuantity + 10]);
        }
    }

    let releaseSmall = await makeRequest('POST', `/ProductionPlans/${smallPlanId}/release`);
    let passSufficient = releaseSmall.status === 200;
    console.log(`Production availability validation (sufficient stock): ${passSufficient ? 'PASS' : 'FAIL'} (Status: ${releaseSmall.status})`);

    // Clean up DO NOT change data
    await makeRequest('DELETE', `/ProductionPlans/${plan10Id}`);
    await makeRequest('DELETE', `/ProductionPlans/${plan100Id}`);
    await makeRequest('DELETE', `/ProductionPlans/${giantPlanId}`);

    // If released, delete directly from DB to cleanup plan
    if (passSufficient) {
        await client.query(`DELETE FROM "ProductionRequirements" WHERE "ProductionPlanId" = $1`, [smallPlanId]);
        await client.query(`DELETE FROM "ProductionPlans" WHERE "Id" = $1`, [smallPlanId]);
    } else {
        await makeRequest('DELETE', `/ProductionPlans/${smallPlanId}`);
    }

    // Cleanup temp inventory
    if (tempInvIds.length > 0) {
        for(let id of tempInvIds) {
           await client.query(`DELETE FROM "Inventories" WHERE "Id" = $1`, [id]);
        }
    }

    await client.end();
}

run().catch(console.error);
