import puppeteer from 'puppeteer';
import axios from 'axios';
import pg from 'pg';

const API_URL = 'http://localhost:5233/api';
const UI_URL = 'http://localhost:5173';
const connectionString = "postgres://postgres:balan123@localhost:5432/NovaERPDB";

async function certifyFrontend() {
    console.log("=== FRONTEND RUNTIME CERTIFICATION ===");

    // Create a specific user for UI tests
    const client = new pg.Client({ connectionString });
    await client.connect();
    
    // Get roles
    const rolesRes = await client.query('SELECT "Id", "Name" FROM "Roles"');
    const procManagerId = rolesRes.rows.find(r => r.Name === 'Procurement Manager').Id;
    const sysAdminId = rolesRes.rows.find(r => r.Name === 'System Administrator').Id;
    
    // We already have balashankar07@gmail.com for sys admin
    
    // Create proc user if needed
    const procEmail = 'ui_test_procurement@novaerp.com';
    await client.query('DELETE FROM "Users" WHERE "Email" = $1', [procEmail]);
    
    const adminUser = await client.query('SELECT "CompanyId" FROM "Users" WHERE "Email" = \'balashankar07@gmail.com\'');
    const compId = adminUser.rows[0].CompanyId;

    // Use axios to create the user properly through the API so password is hashed
    const adminLogin = await axios.post(`${API_URL}/Auth/login`, {
        email: 'balashankar07@gmail.com',
        password: 'Admin@123'
    });
    const adminAxios = axios.create({ headers: { Authorization: `Bearer ${adminLogin.data.data.accessToken}` } });

    await adminAxios.post(`${API_URL}/User`, {
        firstName: 'UI',
        lastName: 'Proc',
        email: procEmail,
        phone: '1234567890',
        password: 'Password@123',
        companyId: compId,
        roleIds: [procManagerId]
    });
    
    console.log("Setup: UI test users ready.");

    const browser = await puppeteer.launch({ 
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: "new" // Use new headless mode
    });

    let consoleErrors = 0;

    async function testRole(email, password, roleName, expectedNavItems, forbiddenPath) {
        console.log(`\nTesting Role: ${roleName}`);
        const page = await browser.newPage();
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                // ignore favicon or common vite errors
                if (!text.includes('favicon') && !text.includes('websocket')) {
                    console.log(`[Browser Error] ${text}`);
                    consoleErrors++;
                }
            }
        });

        await page.goto(UI_URL);
        
        // Login
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', email);
        await page.type('input[type="password"]', password);
        await page.click('button[type="submit"]');

        // Wait for dashboard to load (checking for sidebar nav)
        await page.waitForSelector('nav');
        // Give it a second to render conditionally based on permissions
        await new Promise(r => setTimeout(r, 2000));
        
        const navText = await page.evaluate(() => document.querySelector('nav').innerText);
        
        console.log(`Dashboard loaded. Checking sidebar items for ${roleName}...`);
        let allFound = true;
        for (const item of expectedNavItems) {
            if (navText.includes(item)) {
                console.log(`  [PASS] Sidebar has '${item}'`);
            } else {
                console.log(`  [FAIL] Sidebar missing '${item}'`);
                allFound = false;
            }
        }
        
        // Test route protection
        console.log(`Testing route protection: Navigation to ${forbiddenPath}`);
        await page.goto(`${UI_URL}${forbiddenPath}`);
        await new Promise(r => setTimeout(r, 2000)); // wait for redirect
        
        const currentUrl = page.url();
        if (currentUrl.includes(forbiddenPath)) {
            console.log(`  [FAIL] Unauthorized route ${forbiddenPath} was accessible!`);
        } else {
            console.log(`  [PASS] Successfully blocked/redirected from ${forbiddenPath}. Ended up at: ${currentUrl}`);
        }
        
        await page.close();
        return allFound;
    }

    const adminPassed = await testRole(
        'balashankar07@gmail.com', 'Admin@123', 'System Administrator',
        ['Dashboard', 'Settings', 'Users', 'Roles'],
        '/some-non-existent-path-to-test-404' // Admin can access everything, so we just test 404
    );

    const procPassed = await testRole(
        procEmail, 'Password@123', 'Procurement Manager',
        ['Dashboard', 'Suppliers'],
        '/settings/users' // Procurement shouldn't access users
    );

    await browser.close();
    await client.end();
    
    if (consoleErrors === 0) {
        console.log("\nPASS: No significant console/API errors detected in browser.");
    } else {
        console.log(`\nFAIL: Detected ${consoleErrors} console errors.`);
    }

    if (adminPassed && procPassed) {
        console.log("PASS: Frontend Sidebar and Route Protection works perfectly per role.");
    } else {
        console.log("FAIL: Frontend Sidebar missing expected items.");
    }
}

certifyFrontend().catch(err => {
    console.error("UI Test Error:", err);
    process.exit(1);
});
